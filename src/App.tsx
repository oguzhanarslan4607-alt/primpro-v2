import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  CreditCard,
  Database,
  Download,
  FileText,
  History,
  ReceiptText,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  getCardPaymentKeys,
  getDefaultPriceListId,
  getStandardPaymentKeys,
  getVisiblePriceLists,
  priceListsById,
} from "./data/priceLists";
import { calculateCommission } from "./lib/commissionCalculator";
import { formatTry, parseMoneyInput } from "./lib/currency";
import { loadHistory, saveHistory } from "./lib/storage";
import type { CommissionResult, PaymentMode, PriceListId, SavedCalculation } from "./types";

const assetBaseUrl = import.meta.env.BASE_URL;

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
}

function toInputValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function App() {
  const visiblePriceLists = useMemo(() => getVisiblePriceLists(), []);
  const [priceListId, setPriceListId] = useState<PriceListId>(() => getDefaultPriceListId());
  const priceList = priceListsById[priceListId];
  const productKeys = useMemo(() => Object.keys(priceList.products), [priceList]);

  const [productKey, setProductKey] = useState(productKeys[0]);
  const productPrices = priceList.products[productKey] ?? priceList.products[productKeys[0]];
  const standardPaymentKeys = useMemo(() => getStandardPaymentKeys(productPrices), [productPrices]);
  const cardPaymentKeys = useMemo(() => getCardPaymentKeys(productPrices), [productPrices]);

  const [mode, setMode] = useState<PaymentMode>("standard");
  const [standardPaymentKey, setStandardPaymentKey] = useState(standardPaymentKeys[0]);
  const [cardPaymentKey, setCardPaymentKey] = useState(cardPaymentKeys[0]);
  const paymentKey = mode === "card" ? cardPaymentKey : standardPaymentKey;
  const saleAmount = productPrices[paymentKey] ?? 0;

  const [cashAmount, setCashAmount] = useState("");
  const [cardSettlementAmount, setCardSettlementAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [result, setResult] = useState<CommissionResult | null>(null);
  const [history, setHistory] = useState<SavedCalculation[]>(() => loadHistory());

  const cashAmountNumber = parseMoneyInput(cashAmount);
  const cardSettlementAmountNumber = parseMoneyInput(cardSettlementAmount);
  const noteAmount = Math.max(saleAmount - cashAmountNumber, 0);
  const historyTotal = history.reduce((total, item) => total + item.result.totalCommission, 0);

  useEffect(() => {
    if (!visiblePriceLists.some((list) => list.id === priceListId)) {
      setPriceListId(getDefaultPriceListId());
      setResult(null);
    }
  }, [priceListId, visiblePriceLists]);

  useEffect(() => {
    if (!priceList.products[productKey]) {
      setProductKey(productKeys[0]);
    }
  }, [priceList.products, productKey, productKeys]);

  useEffect(() => {
    if (!standardPaymentKeys.includes(standardPaymentKey)) {
      setStandardPaymentKey(standardPaymentKeys[0]);
    }

    if (!cardPaymentKeys.includes(cardPaymentKey)) {
      setCardPaymentKey(cardPaymentKeys[0]);
    }
  }, [cardPaymentKey, cardPaymentKeys, standardPaymentKey, standardPaymentKeys]);

  useEffect(() => {
    if (mode === "standard" && standardPaymentKey === "PEŞİN") {
      setCashAmount(toInputValue(saleAmount));
    }
  }, [mode, saleAmount, standardPaymentKey]);

  useEffect(() => {
    if (mode === "card") {
      setCardSettlementAmount(toInputValue(saleAmount));
    }
  }, [cardPaymentKey, mode, productKey, priceListId, saleAmount]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  function handleCalculate() {
    const nextResult = calculateCommission({
      priceListId,
      productKey,
      paymentKey,
      mode,
      cashAmount: cashAmountNumber,
      cardSettlementAmount: cardSettlementAmountNumber,
    });

    setResult(nextResult);
  }

  function handleReset() {
    setMode("standard");
    setStandardPaymentKey(standardPaymentKeys[0]);
    setCardPaymentKey(cardPaymentKeys[0]);
    setCashAmount("");
    setCardSettlementAmount("");
    setCustomerName("");
    setResult(null);
  }

  function handleSaveResult() {
    if (!result) return;

    const item: SavedCalculation = {
      id: createId(),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim() || "İsimsiz Müşteri",
      result,
    };

    setHistory((current) => [item, ...current]);
    setCustomerName("");
  }

  function handleDeleteHistoryItem(id: string) {
    setHistory((current) => current.filter((item) => item.id !== id));
  }

  function handleClearHistory() {
    setHistory([]);
  }

  function handleExportCsv() {
    const rows = [
      ["Tarih", "Müşteri", "Fiyat Listesi", "Ürün", "Ödeme", "Satış Tutarı", "Prim"],
      ...history.map((item) => [
        formatDateTime(item.createdAt),
        item.customerName,
        priceListsById[item.result.priceListId].label,
        item.result.productKey,
        item.result.paymentKey,
        item.result.saleAmount.toFixed(2),
        item.result.totalCommission.toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `primpro-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img src={`${assetBaseUrl}icon-192.png`} alt="" className="brand-mark" />
          <div>
            <p className="eyebrow">Yerel taslak</p>
            <h1>PrimPro v2</h1>
          </div>
        </div>
        <div className="status-pill">
          <Database size={16} />
          LocalStorage
        </div>
      </header>

      <main className="workspace">
        <section className="panel calc-panel" aria-labelledby="calculator-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Hesaplama</p>
              <h2 id="calculator-title">Prim hesabı</h2>
            </div>
            <Calculator size={24} />
          </div>

          <div className="field-group">
            <span className="field-label">Fiyat listesi</span>
            <div
              className="segmented"
              style={{ gridTemplateColumns: `repeat(${visiblePriceLists.length}, minmax(0, 1fr))` }}
            >
              {visiblePriceLists.map((list) => (
                <button
                  type="button"
                  key={list.id}
                  className={list.id === priceListId ? "active" : ""}
                  onClick={() => {
                    setPriceListId(list.id);
                    setResult(null);
                  }}
                >
                  {list.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Ürün grubu</span>
              <select
                value={productKey}
                onChange={(event) => {
                  setProductKey(event.target.value);
                  setResult(null);
                }}
              >
                {productKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Satış türü</span>
              <select
                value={mode === "card" ? cardPaymentKey : standardPaymentKey}
                onChange={(event) => {
                  mode === "card" ? setCardPaymentKey(event.target.value) : setStandardPaymentKey(event.target.value);
                  setResult(null);
                }}
              >
                {(mode === "card" ? cardPaymentKeys : standardPaymentKeys).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mode-switch" role="group" aria-label="Ödeme modu">
            <button type="button" className={mode === "standard" ? "active" : ""} onClick={() => setMode("standard")}>
              <ReceiptText size={18} />
              Nakit / Senet
            </button>
            <button type="button" className={mode === "card" ? "active" : ""} onClick={() => setMode("card")}>
              <CreditCard size={18} />
              Kredi Kartı
            </button>
          </div>

          <div className="amount-strip">
            <div>
              <span>Toplam satış</span>
              <strong>{formatTry(saleAmount)}</strong>
            </div>
            {mode === "standard" ? (
              <div>
                <span>Senet kalan</span>
                <strong>{formatTry(noteAmount)}</strong>
              </div>
            ) : (
              <div>
                <span>Hesaba düşen</span>
                <strong>{formatTry(cardSettlementAmountNumber)}</strong>
              </div>
            )}
          </div>

          {mode === "standard" ? (
            <label className="field">
              <span>Nakit / peşinat</span>
              <input
                inputMode="decimal"
                value={cashAmount}
                disabled={standardPaymentKey === "PEŞİN"}
                onChange={(event) => {
                  setCashAmount(event.target.value);
                  setResult(null);
                }}
              />
            </label>
          ) : (
            <label className="field">
              <span>Hesaba düşen tutar</span>
              <input
                inputMode="decimal"
                value={cardSettlementAmount}
                onChange={(event) => {
                  setCardSettlementAmount(event.target.value);
                  setResult(null);
                }}
              />
            </label>
          )}

          <div className="actions">
            <button type="button" className="secondary-button" onClick={handleReset}>
              <RefreshCcw size={18} />
              Temizle
            </button>
            <button type="button" className="primary-button" onClick={handleCalculate}>
              <Calculator size={18} />
              Hesapla
            </button>
          </div>
        </section>

        <section className="panel result-panel" aria-labelledby="result-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Sonuç</p>
              <h2 id="result-title">Prim özeti</h2>
            </div>
            <FileText size={24} />
          </div>

          {result ? (
            <>
              <div className="result-total">
                <span>Toplam prim</span>
                <strong>{formatTry(result.totalCommission)}</strong>
              </div>

              <div className="breakdown-list">
                {result.breakdown.map((line) => (
                  <div className="breakdown-row" key={`${line.label}-${line.rate}`}>
                    <div>
                      <strong>{line.label}</strong>
                      <span>
                        {formatTry(line.grossAmount)} / KDV hariç {formatTry(line.netAmount)}
                      </span>
                    </div>
                    <div>
                      <span>%{line.rate}</span>
                      <strong>{formatTry(line.commission)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <label className="field">
                <span>Müşteri / satış adı</span>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </label>

              <button type="button" className="save-button" onClick={handleSaveResult}>
                <Save size={18} />
                Tabloya kaydet
              </button>
            </>
          ) : (
            <div className="empty-state">
              <Calculator size={28} />
              <strong>Hazır</strong>
              <span>{priceList.label}</span>
            </div>
          )}
        </section>

        <section className="panel history-panel" aria-labelledby="history-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Kayıtlar</p>
              <h2 id="history-title">İşlem tablosu</h2>
            </div>
            <History size={24} />
          </div>

          <div className="history-actions">
            <div>
              <span>Genel toplam</span>
              <strong>{formatTry(historyTotal)}</strong>
            </div>
            <button type="button" onClick={handleExportCsv} disabled={!history.length}>
              <Download size={17} />
              CSV
            </button>
            <button type="button" onClick={handleClearHistory} disabled={!history.length}>
              <Trash2 size={17} />
              Sil
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Ürün</th>
                  <th>Ödeme</th>
                  <th>Prim</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.length ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Müşteri">
                        <strong>{item.customerName}</strong>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </td>
                      <td data-label="Ürün">{item.result.productKey}</td>
                      <td data-label="Ödeme">{item.result.paymentKey}</td>
                      <td data-label="Prim" className="money-cell">
                        {formatTry(item.result.totalCommission)}
                      </td>
                      <td data-label="">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Kaydı sil"
                          onClick={() => handleDeleteHistoryItem(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-table">
                      Kayıt yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

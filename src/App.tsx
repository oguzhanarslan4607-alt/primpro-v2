import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calculator,
  Cloud,
  CreditCard,
  Database,
  Download,
  FileText,
  History,
  LockKeyhole,
  LogOut,
  Printer,
  ReceiptText,
  RefreshCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  getCardPaymentKeys,
  getDefaultPriceListId,
  getStandardPaymentKeys,
  getVisiblePriceLists,
} from "./data/priceLists";
import { calculateCommission } from "./lib/commissionCalculator";
import {
  getOfficialValue,
  loadPriceLists,
  resetPriceLists,
  savePriceLists,
  toPriceListMap,
  updatePriceValue,
} from "./lib/customPriceLists";
import { formatTry, parseMoneyInput } from "./lib/currency";
import {
  clearRemoteHistory,
  deleteRemoteCalculation,
  firebaseConfigured,
  firebaseProjectId,
  loadRemoteHistory,
  loginWithFirebase,
  logoutFirebase,
  saveRemoteCalculation,
  watchFirebaseUser,
} from "./lib/firebaseRepository";
import { loadHistory, saveHistory } from "./lib/storage";
import { clearSession, loadSession, saveSession, verifyLocalPin } from "./lib/auth";
import type { AppUser, CommissionResult, PaymentMode, PriceListId, SavedCalculation } from "./types";

type SectionKey = "calculator" | "reports" | "admin";

const assetBaseUrl = import.meta.env.BASE_URL;

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
}

function todayInputValue() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
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

function isInDateRange(value: string, from: string, to: string) {
  const day = value.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
}

function exportCsv(rows: Array<Array<string | number>>, filename: string) {
  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [activeSection, setActiveSection] = useState<SectionKey>("calculator");
  const [user, setUser] = useState<AppUser | null>(() => loadSession());
  const [authMessage, setAuthMessage] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [priceListVisibilityDate, setPriceListVisibilityDate] = useState(() => new Date());

  const [priceLists, setPriceLists] = useState(() => loadPriceLists());
  const priceListMap = useMemo(() => toPriceListMap(priceLists), [priceLists]);
  const visiblePriceListIds = useMemo(
    () => new Set(getVisiblePriceLists(priceListVisibilityDate).map((list) => list.id)),
    [priceListVisibilityDate],
  );
  const visiblePriceLists = useMemo(
    () => priceLists.filter((list) => visiblePriceListIds.has(list.id)),
    [priceLists, visiblePriceListIds],
  );

  const [priceListId, setPriceListId] = useState<PriceListId>(() => getDefaultPriceListId());
  const priceList = priceListMap[priceListId];
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
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(todayInputValue());
  const [reportProduct, setReportProduct] = useState("all");

  const [adminPriceListId, setAdminPriceListId] = useState<PriceListId>("current");
  const adminPriceList = priceListMap[adminPriceListId];
  const adminProductKeys = Object.keys(adminPriceList.products);
  const [adminProductKey, setAdminProductKey] = useState(adminProductKeys[0]);
  const adminPaymentKeys = Object.keys(adminPriceList.products[adminProductKey] ?? adminPriceList.products[adminProductKeys[0]]);
  const [adminPaymentKey, setAdminPaymentKey] = useState(adminPaymentKeys[0]);
  const [adminPriceValue, setAdminPriceValue] = useState("");
  const [priceJson, setPriceJson] = useState("");

  const isAdmin = user?.role === "admin";
  const cashAmountNumber = parseMoneyInput(cashAmount);
  const cardSettlementAmountNumber = parseMoneyInput(cardSettlementAmount);
  const noteAmount = Math.max(saleAmount - cashAmountNumber, 0);
  const historyTotal = history.reduce((total, item) => total + item.result.totalCommission, 0);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return history.filter((item) => {
      const queryMatch =
        !normalizedQuery ||
        [item.customerName, item.result.productKey, item.result.paymentKey]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);

      const productMatch = reportProduct === "all" || item.result.productKey === reportProduct;
      return queryMatch && productMatch && isInDateRange(item.createdAt, dateFrom, dateTo);
    });
  }, [dateFrom, dateTo, history, query, reportProduct]);

  const reportTotal = filteredHistory.reduce((total, item) => total + item.result.totalCommission, 0);
  const reportSaleTotal = filteredHistory.reduce((total, item) => total + item.result.saleAmount, 0);
  const reportProducts = useMemo(() => Array.from(new Set(history.map((item) => item.result.productKey))).sort(), [history]);
  const productSummary = useMemo(() => {
    const map = new Map<string, { count: number; commission: number; sales: number }>();

    filteredHistory.forEach((item) => {
      const current = map.get(item.result.productKey) ?? { count: 0, commission: 0, sales: 0 };
      current.count += 1;
      current.commission += item.result.totalCommission;
      current.sales += item.result.saleAmount;
      map.set(item.result.productKey, current);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].commission - a[1].commission);
  }, [filteredHistory]);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return watchFirebaseUser((firebaseUser) => {
      if (!firebaseUser) return;

      const nextUser: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? undefined,
        mode: "firebase",
        role: "admin",
      };
      setUser(nextUser);
      saveSession(nextUser);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setPriceListVisibilityDate(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeSection === "admin" && !isAdmin) {
      setActiveSection("calculator");
    }
  }, [activeSection, isAdmin]);

  useEffect(() => {
    if (!user || user.mode !== "firebase") return;

    loadRemoteHistory(user.id)
      .then((remoteHistory) => {
        setHistory(remoteHistory);
        saveHistory(remoteHistory);
      })
      .catch(() => setMessage("Firebase kayıtları okunamadı. Yerel kayıtlar gösteriliyor."));
  }, [user]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

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
    if (!visiblePriceLists.some((list) => list.id === adminPriceListId)) {
      setAdminPriceListId(getDefaultPriceListId());
    }
  }, [adminPriceListId, visiblePriceLists]);

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
    if (!adminPriceList.products[adminProductKey]) {
      setAdminProductKey(adminProductKeys[0]);
    }
  }, [adminPriceList.products, adminProductKey, adminProductKeys]);

  useEffect(() => {
    if (!adminPaymentKeys.includes(adminPaymentKey)) {
      setAdminPaymentKey(adminPaymentKeys[0]);
    }
  }, [adminPaymentKey, adminPaymentKeys]);

  useEffect(() => {
    setAdminPriceValue(toInputValue(adminPriceList.products[adminProductKey]?.[adminPaymentKey] ?? 0));
  }, [adminPaymentKey, adminPriceList.products, adminProductKey]);

  function handleLocalAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (pin.trim().length < 4) {
      setAuthMessage("PIN en az 4 haneli olmalı.");
      return;
    }

    const role = verifyLocalPin(pin);
    if (role) {
      const nextUser: AppUser = { id: `local-${role}`, mode: "local", role };
      setUser(nextUser);
      saveSession(nextUser);
      return;
    }

    setAuthMessage("PIN hatalı.");
  }

  async function handleFirebaseAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    try {
      await loginWithFirebase(email.trim(), password);
    } catch {
      setAuthMessage("Firebase girişi başarısız. E-posta ve şifreyi kontrol edin.");
    }
  }

  async function handleLogout() {
    clearSession();
    await logoutFirebase();
    setUser(null);
    setPin("");
    setPassword("");
  }

  function handleCalculate() {
    const nextResult = calculateCommission(
      {
        priceListId,
        productKey,
        paymentKey,
        mode,
        cashAmount: cashAmountNumber,
        cardSettlementAmount: cardSettlementAmountNumber,
      },
      priceListMap,
    );

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

  async function handleSaveResult() {
    if (!result || !user) return;

    const item: SavedCalculation = {
      id: createId(),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim() || "İsimsiz Müşteri",
      result,
    };

    setHistory((current) => [item, ...current]);
    setCustomerName("");
    setMessage("Kayıt tabloya eklendi.");

    if (user.mode === "firebase") {
      await saveRemoteCalculation(user.id, item);
    }
  }

  async function handleDeleteHistoryItem(id: string) {
    setHistory((current) => current.filter((item) => item.id !== id));

    if (user?.mode === "firebase") {
      await deleteRemoteCalculation(id);
    }
  }

  async function handleClearHistory() {
    setHistory([]);

    if (user?.mode === "firebase") {
      await clearRemoteHistory(user.id);
    }
  }

  function handleExportCsv(rows = filteredHistory) {
    exportCsv(
      [
        ["Tarih", "Müşteri", "Fiyat Listesi", "Ürün", "Ödeme", "Satış Tutarı", "Prim"],
        ...rows.map((item) => [
          formatDateTime(item.createdAt),
          item.customerName,
          priceListMap[item.result.priceListId].label,
          item.result.productKey,
          item.result.paymentKey,
          item.result.saleAmount.toFixed(2),
          item.result.totalCommission.toFixed(2),
        ]),
      ],
      `primpro-rapor-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function handlePrintReport() {
    window.print();
  }

  async function handleInstallApp() {
    if (!installPrompt) return;

    const promptEvent = installPrompt as Event & { prompt?: () => Promise<void> };
    await promptEvent.prompt?.();
    setInstallPrompt(null);
  }

  function handleUpdatePrice() {
    const value = parseMoneyInput(adminPriceValue);
    const updated = updatePriceValue(priceLists, adminPriceListId, adminProductKey, adminPaymentKey, value);
    setPriceLists(updated);
    savePriceLists(updated);
    setResult(null);
    setMessage("Fiyat listesi yerel olarak güncellendi.");
  }

  function handleResetPrices() {
    const official = resetPriceLists();
    setPriceLists(official);
    setResult(null);
    setMessage("Fiyat listeleri resmi değerlere döndü.");
  }

  function handleExportPrices() {
    const exportableLists = priceLists.filter((list) => visiblePriceListIds.has(list.id));
    setPriceJson(JSON.stringify(exportableLists, null, 2));
  }

  function handleImportPrices() {
    try {
      const parsed = JSON.parse(priceJson) as typeof priceLists;
      const updated = priceLists.map((list) => {
        if (!visiblePriceListIds.has(list.id)) return list;

        const importedList = parsed.find((item) => item.id === list.id);
        return importedList?.products ? { ...list, products: importedList.products } : list;
      });

      savePriceLists(updated);
      setPriceLists(updated);
      setResult(null);
      setMessage("Fiyat listesi JSON içe aktarıldı.");
    } catch {
      setMessage("JSON okunamadı. Formatı kontrol edin.");
    }
  }

  if (!user) {
    return (
      <AuthScreen
        authMessage={authMessage}
        email={email}
        password={password}
        pin={pin}
        setEmail={setEmail}
        setPassword={setPassword}
        setPin={setPin}
        onFirebaseSubmit={handleFirebaseAuth}
        onLocalSubmit={handleLocalAuth}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand-lockup">
          <img src={`${assetBaseUrl}icon-192.png`} alt="" className="brand-mark" />
          <div>
            <p className="eyebrow">{user.mode === "firebase" ? "Bulut kayıt" : "Yerel güvenli mod"}</p>
            <h1>PrimPro v2</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`status-pill ${user.mode === "firebase" ? "is-cloud" : ""}`}>
            {user.mode === "firebase" ? <Cloud size={16} /> : <Database size={16} />}
            {user.mode === "firebase" ? firebaseProjectId : isAdmin ? "Yönetici" : "Kullanıcı"}
          </div>
          <button className="icon-text-button" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            Çıkış
          </button>
        </div>
      </header>

      <nav
        className="section-tabs no-print"
        aria-label="Uygulama bölümleri"
        style={{ gridTemplateColumns: `repeat(${isAdmin ? 3 : 2}, minmax(0, 1fr))` }}
      >
        <button className={activeSection === "calculator" ? "active" : ""} onClick={() => setActiveSection("calculator")}>
          <Calculator size={18} />
          Hesaplama
        </button>
        <button className={activeSection === "reports" ? "active" : ""} onClick={() => setActiveSection("reports")}>
          <BarChart3 size={18} />
          Raporlar
        </button>
        {isAdmin && (
          <button className={activeSection === "admin" ? "active" : ""} onClick={() => setActiveSection("admin")}>
            <Settings size={18} />
            Admin
          </button>
        )}
      </nav>

      {message && (
        <div className="notice no-print" role="status">
          {message}
          <button type="button" onClick={() => setMessage("")}>
            Kapat
          </button>
        </div>
      )}

      {installPrompt && (
        <div className="install-card no-print">
          <Smartphone size={20} />
          <div>
            <strong>Mobilde uygulama gibi kullan</strong>
            <span>Ana ekrana ekleyince daha hızlı açılır ve offline destek kullanır.</span>
          </div>
          <button type="button" onClick={handleInstallApp}>
            Ekle
          </button>
        </div>
      )}

      {activeSection === "calculator" && (
        <CalculatorSection
          cardPaymentKey={cardPaymentKey}
          cardPaymentKeys={cardPaymentKeys}
          cardSettlementAmount={cardSettlementAmount}
          cardSettlementAmountNumber={cardSettlementAmountNumber}
          cashAmount={cashAmount}
          noteAmount={noteAmount}
          customerName={customerName}
          mode={mode}
          paymentKey={paymentKey}
          priceList={priceList}
          priceListId={priceListId}
          productKey={productKey}
          productKeys={productKeys}
          result={result}
          saleAmount={saleAmount}
          standardPaymentKey={standardPaymentKey}
          standardPaymentKeys={standardPaymentKeys}
          visiblePriceLists={visiblePriceLists}
          onCalculate={handleCalculate}
          onReset={handleReset}
          onSaveResult={handleSaveResult}
          setCardPaymentKey={setCardPaymentKey}
          setCardSettlementAmount={setCardSettlementAmount}
          setCashAmount={setCashAmount}
          setCustomerName={setCustomerName}
          setMode={setMode}
          setPriceListId={setPriceListId}
          setProductKey={setProductKey}
          setResult={setResult}
          setStandardPaymentKey={setStandardPaymentKey}
        />
      )}

      {activeSection === "reports" && (
        <ReportsSection
          dateFrom={dateFrom}
          dateTo={dateTo}
          filteredHistory={filteredHistory}
          history={history}
          historyTotal={historyTotal}
          productSummary={productSummary}
          query={query}
          reportProduct={reportProduct}
          reportProducts={reportProducts}
          reportSaleTotal={reportSaleTotal}
          reportTotal={reportTotal}
          onClearHistory={handleClearHistory}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onExportCsv={() => handleExportCsv(filteredHistory)}
          onPrintReport={handlePrintReport}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setQuery={setQuery}
          setReportProduct={setReportProduct}
        />
      )}

      {activeSection === "admin" && isAdmin && (
        <AdminSection
          adminPaymentKey={adminPaymentKey}
          adminPaymentKeys={adminPaymentKeys}
          adminPriceListId={adminPriceListId}
          adminPriceValue={adminPriceValue}
          adminProductKey={adminProductKey}
          adminProductKeys={adminProductKeys}
          officialValue={getOfficialValue(adminPriceListId, adminProductKey, adminPaymentKey)}
          priceJson={priceJson}
          priceLists={visiblePriceLists}
          onExportPrices={handleExportPrices}
          onImportPrices={handleImportPrices}
          onResetPrices={handleResetPrices}
          onUpdatePrice={handleUpdatePrice}
          setAdminPaymentKey={setAdminPaymentKey}
          setAdminPriceListId={setAdminPriceListId}
          setAdminPriceValue={setAdminPriceValue}
          setAdminProductKey={setAdminProductKey}
          setPriceJson={setPriceJson}
        />
      )}

      <PrintableReport filteredHistory={filteredHistory} productSummary={productSummary} reportTotal={reportTotal} />
    </div>
  );
}

function AuthScreen({
  authMessage,
  email,
  password,
  pin,
  setEmail,
  setPassword,
  setPin,
  onFirebaseSubmit,
  onLocalSubmit,
}: {
  authMessage: string;
  email: string;
  password: string;
  pin: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPin: (value: string) => void;
  onFirebaseSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLocalSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <img src={`${assetBaseUrl}icon-192.png`} alt="" className="auth-logo" />
        <p className="eyebrow">Güvenli giriş</p>
        <h1>PrimPro v2</h1>

        <form className="auth-form" onSubmit={onLocalSubmit}>
          <label className="field">
            <span>PIN</span>
            <input inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            <LockKeyhole size={18} />
            Giriş yap
          </button>
        </form>

        {firebaseConfigured && (
          <form className="auth-form auth-firebase" onSubmit={onFirebaseSubmit}>
            <div className="divider">veya Firebase</div>
            <label className="field">
              <span>E-posta</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field">
              <span>Şifre</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="secondary-button" type="submit">
              <Cloud size={18} />
              Firebase ile gir
            </button>
          </form>
        )}

        {authMessage && <p className="auth-error">{authMessage}</p>}
      </section>
    </main>
  );
}

function CalculatorSection(props: {
  cardPaymentKey: string;
  cardPaymentKeys: string[];
  cardSettlementAmount: string;
  cardSettlementAmountNumber: number;
  cashAmount: string;
  customerName: string;
  mode: PaymentMode;
  noteAmount: number;
  paymentKey: string;
  priceList: { id: PriceListId; label: string };
  priceListId: PriceListId;
  productKey: string;
  productKeys: string[];
  result: CommissionResult | null;
  saleAmount: number;
  standardPaymentKey: string;
  standardPaymentKeys: string[];
  visiblePriceLists: Array<{ id: PriceListId; shortLabel: string }>;
  onCalculate: () => void;
  onReset: () => void;
  onSaveResult: () => void;
  setCardPaymentKey: (value: string) => void;
  setCardSettlementAmount: (value: string) => void;
  setCashAmount: (value: string) => void;
  setCustomerName: (value: string) => void;
  setMode: (value: PaymentMode) => void;
  setPriceListId: (value: PriceListId) => void;
  setProductKey: (value: string) => void;
  setResult: (value: CommissionResult | null) => void;
  setStandardPaymentKey: (value: string) => void;
}) {
  return (
    <main className="workspace no-print">
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
            style={{ gridTemplateColumns: `repeat(${props.visiblePriceLists.length}, minmax(0, 1fr))` }}
          >
            {props.visiblePriceLists.map((list) => (
              <button
                type="button"
                key={list.id}
                className={list.id === props.priceListId ? "active" : ""}
                onClick={() => {
                  props.setPriceListId(list.id);
                  props.setResult(null);
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
              value={props.productKey}
              onChange={(event) => {
                props.setProductKey(event.target.value);
                props.setResult(null);
              }}
            >
              {props.productKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Satış türü</span>
            <select
              value={props.mode === "card" ? props.cardPaymentKey : props.standardPaymentKey}
              onChange={(event) => {
                props.mode === "card" ? props.setCardPaymentKey(event.target.value) : props.setStandardPaymentKey(event.target.value);
                props.setResult(null);
              }}
            >
              {(props.mode === "card" ? props.cardPaymentKeys : props.standardPaymentKeys).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mode-switch" role="group" aria-label="Ödeme modu">
          <button type="button" className={props.mode === "standard" ? "active" : ""} onClick={() => props.setMode("standard")}>
            <ReceiptText size={18} />
            Nakit / Senet
          </button>
          <button type="button" className={props.mode === "card" ? "active" : ""} onClick={() => props.setMode("card")}>
            <CreditCard size={18} />
            Kredi Kartı
          </button>
        </div>

        <div className="amount-strip">
          <div>
            <span>Toplam satış</span>
            <strong>{formatTry(props.saleAmount)}</strong>
          </div>
          {props.mode === "standard" ? (
            <div>
              <span>Senet kalan</span>
              <strong>{formatTry(props.noteAmount)}</strong>
            </div>
          ) : (
            <div>
              <span>Hesaba düşen</span>
              <strong>{formatTry(props.cardSettlementAmountNumber)}</strong>
            </div>
          )}
        </div>

        {props.mode === "standard" ? (
          <label className="field">
            <span>Nakit / peşinat</span>
            <input
              inputMode="decimal"
              value={props.cashAmount}
              disabled={props.standardPaymentKey === "PEŞİN"}
              onChange={(event) => {
                props.setCashAmount(event.target.value);
                props.setResult(null);
              }}
            />
          </label>
        ) : (
          <label className="field">
            <span>Hesaba düşen tutar</span>
            <input
              inputMode="decimal"
              value={props.cardSettlementAmount}
              onChange={(event) => {
                props.setCardSettlementAmount(event.target.value);
                props.setResult(null);
              }}
            />
          </label>
        )}

        <div className="actions">
          <button type="button" className="secondary-button" onClick={props.onReset}>
            <RefreshCcw size={18} />
            Temizle
          </button>
          <button type="button" className="primary-button" onClick={props.onCalculate}>
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

        {props.result ? (
          <>
            <div className="result-total">
              <span>Toplam prim</span>
              <strong>{formatTry(props.result.totalCommission)}</strong>
            </div>

            <div className="calc-details">
              <div>
                <span>Satış tutarı</span>
                <strong>{formatTry(props.result.saleAmount)}</strong>
              </div>
              <div>
                <span>KDV hariç toplam</span>
                <strong>{formatTry(props.result.totalNetAmount)}</strong>
              </div>
              <div>
                <span>Liste / ödeme</span>
                <strong>{props.priceList.label} / {props.paymentKey}</strong>
              </div>
            </div>

            <div className="breakdown-list">
              {props.result.breakdown.map((line) => (
                <div className="breakdown-row" key={`${line.label}-${line.rate}`}>
                  <div>
                    <strong>{line.label}</strong>
                    <span>
                      {formatTry(line.grossAmount)} / 1.20 = {formatTry(line.netAmount)}
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
              <input value={props.customerName} onChange={(event) => props.setCustomerName(event.target.value)} />
            </label>

            <button type="button" className="save-button" onClick={props.onSaveResult}>
              <Save size={18} />
              Tabloya kaydet
            </button>
          </>
        ) : (
          <div className="empty-state">
            <Calculator size={28} />
            <strong>Hazır</strong>
            <span>{props.priceList.label}</span>
          </div>
        )}
      </section>
    </main>
  );
}

function ReportsSection({
  dateFrom,
  dateTo,
  filteredHistory,
  history,
  historyTotal,
  productSummary,
  query,
  reportProduct,
  reportProducts,
  reportSaleTotal,
  reportTotal,
  onClearHistory,
  onDeleteHistoryItem,
  onExportCsv,
  onPrintReport,
  setDateFrom,
  setDateTo,
  setQuery,
  setReportProduct,
}: {
  dateFrom: string;
  dateTo: string;
  filteredHistory: SavedCalculation[];
  history: SavedCalculation[];
  historyTotal: number;
  productSummary: Array<[string, { count: number; commission: number; sales: number }]>;
  query: string;
  reportProduct: string;
  reportProducts: string[];
  reportSaleTotal: number;
  reportTotal: number;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onExportCsv: () => void;
  onPrintReport: () => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setQuery: (value: string) => void;
  setReportProduct: (value: string) => void;
}) {
  return (
    <main className="reports-layout no-print">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Raporlar</p>
            <h2>Filtre ve çıktı</h2>
          </div>
          <BarChart3 size={24} />
        </div>

        <div className="report-filters">
          <label className="field search-field">
            <span>Arama</span>
            <div className="input-with-icon">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Müşteri, ürün, ödeme" />
            </div>
          </label>
          <label className="field">
            <span>Başlangıç</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="field">
            <span>Bitiş</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="field">
            <span>Ürün</span>
            <select value={reportProduct} onChange={(event) => setReportProduct(event.target.value)}>
              <option value="all">Tüm ürünler</option>
              {reportProducts.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="report-metrics">
          <div>
            <span>Kayıt</span>
            <strong>{filteredHistory.length}</strong>
          </div>
          <div>
            <span>Satış toplamı</span>
            <strong>{formatTry(reportSaleTotal)}</strong>
          </div>
          <div>
            <span>Prim toplamı</span>
            <strong>{formatTry(reportTotal)}</strong>
          </div>
          <div>
            <span>Tüm kayıt primi</span>
            <strong>{formatTry(historyTotal)}</strong>
          </div>
        </div>

        <div className="history-actions">
          <button type="button" onClick={onExportCsv} disabled={!filteredHistory.length}>
            <Download size={17} />
            CSV
          </button>
          <button type="button" onClick={onPrintReport} disabled={!filteredHistory.length}>
            <Printer size={17} />
            PDF / Yazdır
          </button>
          <button type="button" onClick={onClearHistory} disabled={!history.length}>
            <Trash2 size={17} />
            Tümünü sil
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Özet</p>
            <h2>Ürün bazlı toplam</h2>
          </div>
          <History size={24} />
        </div>
        <div className="summary-grid">
          {productSummary.length ? (
            productSummary.map(([product, summary]) => (
              <div className="summary-card" key={product}>
                <strong>{product}</strong>
                <span>{summary.count} kayıt / {formatTry(summary.sales)} satış</span>
                <b>{formatTry(summary.commission)}</b>
              </div>
            ))
          ) : (
            <div className="empty-state small">Filtreye uygun kayıt yok</div>
          )}
        </div>
      </section>

      <HistoryTable history={filteredHistory} onDeleteHistoryItem={onDeleteHistoryItem} />
    </main>
  );
}

function HistoryTable({
  history,
  onDeleteHistoryItem,
}: {
  history: SavedCalculation[];
  onDeleteHistoryItem: (id: string) => void;
}) {
  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Kayıtlar</p>
          <h2 id="history-title">İşlem tablosu</h2>
        </div>
        <History size={24} />
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
                      onClick={() => onDeleteHistoryItem(item.id)}
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
  );
}

function AdminSection({
  adminPaymentKey,
  adminPaymentKeys,
  adminPriceListId,
  adminPriceValue,
  adminProductKey,
  adminProductKeys,
  officialValue,
  priceJson,
  priceLists,
  onExportPrices,
  onImportPrices,
  onResetPrices,
  onUpdatePrice,
  setAdminPaymentKey,
  setAdminPriceListId,
  setAdminPriceValue,
  setAdminProductKey,
  setPriceJson,
}: {
  adminPaymentKey: string;
  adminPaymentKeys: string[];
  adminPriceListId: PriceListId;
  adminPriceValue: string;
  adminProductKey: string;
  adminProductKeys: string[];
  officialValue: number;
  priceJson: string;
  priceLists: Array<{ id: PriceListId; label: string; shortLabel: string }>;
  onExportPrices: () => void;
  onImportPrices: () => void;
  onResetPrices: () => void;
  onUpdatePrice: () => void;
  setAdminPaymentKey: (value: string) => void;
  setAdminPriceListId: (value: PriceListId) => void;
  setAdminPriceValue: (value: string) => void;
  setAdminProductKey: (value: string) => void;
  setPriceJson: (value: string) => void;
}) {
  return (
    <main className="admin-layout no-print">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Fiyat listesi yönetimi</h2>
          </div>
          <Settings size={24} />
        </div>

        <div className="form-grid admin-grid">
          <label className="field">
            <span>Liste</span>
            <select value={adminPriceListId} onChange={(event) => setAdminPriceListId(event.target.value as PriceListId)}>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ürün</span>
            <select value={adminProductKey} onChange={(event) => setAdminProductKey(event.target.value)}>
              {adminProductKeys.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ödeme</span>
            <select value={adminPaymentKey} onChange={(event) => setAdminPaymentKey(event.target.value)}>
              {adminPaymentKeys.map((payment) => (
                <option key={payment} value={payment}>
                  {payment}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tutar</span>
            <input inputMode="decimal" value={adminPriceValue} onChange={(event) => setAdminPriceValue(event.target.value)} />
          </label>
        </div>

        <div className="amount-strip">
          <div>
            <span>Resmi değer</span>
            <strong>{formatTry(officialValue)}</strong>
          </div>
          <div>
            <span>Yerel değer</span>
            <strong>{formatTry(parseMoneyInput(adminPriceValue))}</strong>
          </div>
        </div>

        <div className="actions">
          <button type="button" className="secondary-button" onClick={onResetPrices}>
            <RefreshCcw size={18} />
            Resmi değerlere dön
          </button>
          <button type="button" className="primary-button" onClick={onUpdatePrice}>
            <Save size={18} />
            Fiyatı kaydet
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">JSON</p>
            <h2>Yedek / içe aktar</h2>
          </div>
          <Download size={24} />
        </div>
        <label className="field">
          <span>Fiyat listesi JSON</span>
          <textarea value={priceJson} onChange={(event) => setPriceJson(event.target.value)} />
        </label>
        <div className="actions">
          <button type="button" className="secondary-button" onClick={onExportPrices}>
            <Download size={18} />
            Dışa aktar
          </button>
          <button type="button" className="primary-button" onClick={onImportPrices}>
            <Save size={18} />
            İçe aktar
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Güvenlik</p>
            <h2>Rol bilgisi</h2>
          </div>
          <ShieldCheck size={24} />
        </div>
        <p className="muted-text">
          Bu ekrana yalnızca yönetici PIN'i ile girenler ulaşabilir. Kullanıcı PIN'iyle girişte admin ayarları gizlenir.
        </p>
      </section>
    </main>
  );
}

function PrintableReport({
  filteredHistory,
  productSummary,
  reportTotal,
}: {
  filteredHistory: SavedCalculation[];
  productSummary: Array<[string, { count: number; commission: number; sales: number }]>;
  reportTotal: number;
}) {
  return (
    <section className="print-report">
      <h1>PrimPro Raporu</h1>
      <p>{new Date().toLocaleDateString("tr-TR")} işlem özeti</p>
      <h2>Toplam Prim: {formatTry(reportTotal)}</h2>

      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Müşteri</th>
            <th>Ürün</th>
            <th>Ödeme</th>
            <th>Prim</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.map((item) => (
            <tr key={item.id}>
              <td>{formatDateTime(item.createdAt)}</td>
              <td>{item.customerName}</td>
              <td>{item.result.productKey}</td>
              <td>{item.result.paymentKey}</td>
              <td>{formatTry(item.result.totalCommission)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Ürün Özeti</h2>
      <table>
        <tbody>
          {productSummary.map(([product, summary]) => (
            <tr key={product}>
              <td>{product}</td>
              <td>{summary.count} kayıt</td>
              <td>{formatTry(summary.commission)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

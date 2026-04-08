import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGrJ4yGky-G6y_rMBKvaq3fFXN8U9m0KQ",
  authDomain: "crm-jannired.firebaseapp.com",
  projectId: "crm-jannired",
  storageBucket: "crm-jannired.firebasestorage.app",
  messagingSenderId: "66237603538",
  appId: "1:66237603538:web:ca2ca01c1d912b4a92170b",
  measurementId: "G-0XL7W2J4QJ"
};

const CLIENTS_COLLECTION = "clients";

let app;
let db;
let clientsCollection;

const form = document.getElementById("client-form");
const formTitle = document.getElementById("form-title");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const importFileInput = document.getElementById("import-file-input");
const syncStatus = document.getElementById("sync-status");
const clientIdInput = document.getElementById("client-id");
const cityInput = document.getElementById("city");
const storeNameInput = document.getElementById("storeName");
const addressInput = document.getElementById("address");
const storePhoneInput = document.getElementById("storePhone");
const ownerNameInput = document.getElementById("ownerName");
const ownerPhoneInput = document.getElementById("ownerPhone");
const managerNameInput = document.getElementById("managerName");
const managerPhoneInput = document.getElementById("managerPhone");
const emailInput = document.getElementById("email");
const clientCards = document.getElementById("client-cards");
const followupTableBody = document.getElementById("followup-table-body");
const todayVisitsTableBody = document.getElementById("today-visits-table-body");
const inactiveVisitsTableBody = document.getElementById("inactive-visits-table-body");
const inactiveOrdersTableBody = document.getElementById("inactive-orders-table-body");
const difficultClientsTableBody = document.getElementById("difficult-clients-table-body");
const topClientsTableBody = document.getElementById("top-clients-table-body");
const routeByCity = document.getElementById("route-by-city");
const historyCard = document.getElementById("history-card");
const historyTitle = document.getElementById("history-title");
const historyTableBody = document.getElementById("history-table-body");
const closeHistoryButton = document.getElementById("close-history-button");
const detailsCard = document.getElementById("details-card");
const detailsTitle = document.getElementById("details-title");
const detailsGrid = document.getElementById("details-grid");
const closeDetailsButton = document.getElementById("close-details-button");
const tastingCard = document.getElementById("tasting-card");
const tastingTitle = document.getElementById("tasting-title");
const tastingTableBody = document.getElementById("tasting-table-body");
const closeTastingButton = document.getElementById("close-tasting-button");
const orderFormCard = document.getElementById("order-form-card");
const orderFormTitle = document.getElementById("order-form-title");
const orderForm = document.getElementById("order-form");
const orderClientIdInput = document.getElementById("order-client-id");
const orderDateInput = document.getElementById("order-date");
const orderLines = document.getElementById("order-lines");
const addOrderLineButton = document.getElementById("add-order-line-button");
const closeOrderFormButton = document.getElementById("close-order-form-button");
const cancelOrderFormButton = document.getElementById("cancel-order-form-button");
const orderTotalAmount = document.getElementById("order-total-amount");
const searchInput = document.getElementById("search-input");
const cityFilter = document.getElementById("city-filter");
const clientTypeFilter = document.getElementById("client-type-filter");
const followupCityFilter = document.getElementById("followup-city-filter");
const purchaseNoFilter = document.getElementById("purchase-no-filter");
const priorityHighFilter = document.getElementById("priority-high-filter");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const overdueVisitsElement = document.getElementById("overdue-visits");
const tastingsTodayElement = document.getElementById("tastings-today");
const visitsTodayElement = document.getElementById("visits-today");
const overdueFollowupsElement = document.getElementById("overdue-followups");
const activeClientsElement = document.getElementById("active-clients");
const prospectsElement = document.getElementById("prospects");
const PRODUCT_OPTIONS = [
  "750 ml Blanco",
  "750 ml Reposado",
  "750 ml Añejo",
  "0.50 ml Blanco",
  "0.50 ml Reposado",
  "0.50 ml Añejo"
];

const ORDERS_ENABLED = true;

let clients = [];
let isFirestoreReady = false;

form.addEventListener("submit", handleSubmit);
if (orderForm) {
  orderForm.addEventListener("submit", handleOrderSubmit);
}
exportButton.addEventListener("click", exportData);
importButton.addEventListener("click", openImportPicker);
importFileInput.addEventListener("change", importData);
if (addOrderLineButton) {
  addOrderLineButton.addEventListener("click", () => addOrderLine());
}
searchInput.addEventListener("input", renderClients);
cityFilter.addEventListener("change", renderClients);
clientTypeFilter.addEventListener("change", renderClients);
followupCityFilter.addEventListener("change", renderClients);
purchaseNoFilter.addEventListener("change", renderClients);
priorityHighFilter.addEventListener("change", renderClients);
cancelButton.addEventListener("click", resetForm);
closeHistoryButton.addEventListener("click", closeHistory);
closeDetailsButton.addEventListener("click", closeDetails);
closeTastingButton.addEventListener("click", closeTasting);
if (closeOrderFormButton) {
  closeOrderFormButton.addEventListener("click", closeOrderForm);
}
if (cancelOrderFormButton) {
  cancelOrderFormButton.addEventListener("click", closeOrderForm);
}
if (orderLines) {
  orderLines.addEventListener("click", handleOrderLineClick);
  orderLines.addEventListener("input", renderOrderTotal);
  orderLines.addEventListener("change", renderOrderTotal);
}

console.log("app started");
renderClients();
initializeFirebase();

async function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    console.log("firebase initialized");
    db = getFirestore(app);
    clientsCollection = collection(db, CLIENTS_COLLECTION);
    isFirestoreReady = true;
    console.log("firestore connected", { collection: CLIENTS_COLLECTION });
    await loadClientsFromFirestore();
  } catch (error) {
    console.error("Firebase initialization error:", error);
    setSyncStatus("Firebase could not start.");
    window.alert("Firebase could not start. Check the console for the exact error.");
  }
}

async function loadClientsFromFirestore() {
  if (!clientsCollection) {
    console.error("Firestore collection is not ready.");
    setSyncStatus("Firestore is not ready.");
    return;
  }

  setSyncStatus("Loading clients from Firestore...");
  console.log("loading clients", { collection: CLIENTS_COLLECTION });

  try {
    const snapshot = await getDocs(clientsCollection);
    clients = snapshot.docs
      .map((item) => normalizeClient({ id: item.id, ...item.data() }))
      .sort((a, b) => a.storeName.localeCompare(b.storeName));

    console.log("clients loaded count", snapshot.size);
    setSyncStatus(`Firestore connected. ${clients.length} client${clients.length === 1 ? "" : "s"} loaded.`);
    renderClients();
  } catch (error) {
    isFirestoreReady = false;
    console.error("loading clients error", error);
    console.error(error);
    setSyncStatus("Could not load Firestore data.");
    window.alert("Could not connect to Firestore. Check your Firebase project settings and rules.");
  }
}

function ensureFirestoreReady() {
  if (db && clientsCollection && isFirestoreReady) {
    return true;
  }

  console.error("Firestore is not ready yet.", {
    appReady: Boolean(app),
    dbReady: Boolean(db),
    collectionReady: Boolean(clientsCollection),
    isFirestoreReady
  });
  setSyncStatus("Waiting for Firestore connection...");
  window.alert("Firestore is still connecting. Please wait a moment and try again.");
  return false;
}

async function saveClientToFirestore(client) {
  if (!ensureFirestoreReady()) {
    throw new Error("Firestore is not ready.");
  }

  try {
    let clientId = client.id;

    if (!clientId) {
      clientId = doc(clientsCollection).id;
      client.id = clientId;
    }

    const clientDoc = doc(db, CLIENTS_COLLECTION, clientId);
    await setDoc(clientDoc, client, { merge: true });
    return client;
  } catch (error) {
    console.error("Firestore save error:", error);
    throw error;
  }
}

function exportData() {
  const backupData = {
    exportedAt: new Date().toISOString(),
    clients
  };
  const fileContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([fileContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = `crm-backup-${getTodayString()}.json`;
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function openImportPicker() {
  importFileInput.value = "";
  importFileInput.click();
}

async function importData(event) {
  importFileInput.value = "";
  setSyncStatus("Import is temporarily disabled.");
  window.alert("Import is temporarily disabled to protect existing Firestore client documents.");
}

function normalizeClient(client) {
  return {
    id: client.id || crypto.randomUUID(),
    city: client.city || "",
    storeName: client.storeName || "",
    address: client.address || "",
    storePhone: client.storePhone || client.phone || "",
    ownerName: client.ownerName || "",
    ownerPhone: client.ownerPhone || "",
    managerName: client.managerName || "",
    managerPhone: client.managerPhone || "",
    email: client.email || "",
    tastingStatus: client.tastingStatus || "",
    tastingDate: client.tastingDate || "",
    purchaseStatus: client.purchaseStatus || "",
    productsPurchased: client.productsPurchased || "",
    priority: client.priority || "",
    notes: client.notes || "",
    nextVisitDate: client.nextVisitDate || "",
    clientType: client.clientType || "Other",
    visitCount: client.visitCount || 1,
    lastVisitDate: client.lastVisitDate || "",
    lastOrderDate: client.lastOrderDate || "",
    createdDate: client.createdDate || getTodayString(),
    lastTastingDate: client.lastTastingDate || client.tastingDate || "",
    visitHistory: client.visitHistory || [],
    tastingHistory: client.tastingHistory || [],
    orderHistory: client.orderHistory || client.deliveryHistory || []
  };
}

async function handleSubmit(event) {
  event.preventDefault();

  const existingClient = clients.find((item) => item.id === clientIdInput.value);

  const client = normalizeClient({
    id: clientIdInput.value || "",
    city: cityInput.value.trim(),
    storeName: storeNameInput.value.trim(),
    address: addressInput.value.trim(),
    storePhone: storePhoneInput.value.trim(),
    ownerName: ownerNameInput.value.trim(),
    ownerPhone: ownerPhoneInput.value.trim(),
    managerName: managerNameInput.value.trim(),
    managerPhone: managerPhoneInput.value.trim(),
    email: emailInput.value.trim(),
    tastingStatus: existingClient ? existingClient.tastingStatus || "" : "",
    tastingDate: existingClient ? existingClient.tastingDate || "" : "",
    purchaseStatus: existingClient ? existingClient.purchaseStatus || "" : "",
    productsPurchased: existingClient ? existingClient.productsPurchased || "" : "",
    priority: existingClient ? existingClient.priority || "" : "",
    notes: existingClient ? existingClient.notes || "" : "",
    nextVisitDate: existingClient ? existingClient.nextVisitDate || "" : "",
    clientType: existingClient ? existingClient.clientType || "Other" : "Other",
    visitCount: existingClient ? existingClient.visitCount || 1 : 1,
    lastVisitDate: existingClient ? existingClient.lastVisitDate || "" : "",
    lastOrderDate: existingClient ? existingClient.lastOrderDate || "" : "",
    createdDate: existingClient ? existingClient.createdDate || getTodayString() : getTodayString(),
    lastTastingDate: existingClient
      ? existingClient.lastTastingDate || existingClient.tastingDate || ""
      : "",
    visitHistory: existingClient ? existingClient.visitHistory || [] : [],
    tastingHistory: existingClient ? existingClient.tastingHistory || [] : [],
    orderHistory: existingClient ? existingClient.orderHistory || [] : []
  });

  try {
    console.log("saving client", {
      id: client.id || "(new)",
      storeName: client.storeName
    });
    setSyncStatus(existingClient ? "Updating client in Firestore..." : "Saving client to Firestore...");
    const savedClient = await saveClientToFirestore(client);
    console.log("client saved", {
      id: savedClient.id,
      storeName: savedClient.storeName
    });
    await loadClientsFromFirestore();
    resetForm();
    setSyncStatus(existingClient ? "Client updated in Firestore." : "Client saved to Firestore.");
  } catch (error) {
    console.error("save error", error);
    console.error(error);
    setSyncStatus("Could not save client.");
    window.alert("Could not save this client to Firestore.");
  }
}

function renderClients() {
  renderDashboard();
  updateCityFilter();
  renderFollowupView();
  renderTodayVisits();
  renderInactiveVisits();
  renderInactiveOrders();
  renderDifficultClients();
  renderTopClients();
  renderRouteByCity();

  const searchText = searchInput.value.trim().toLowerCase();
  const selectedCity = cityFilter.value;
  const selectedClientType = clientTypeFilter.value;
  const onlyPurchaseNo = purchaseNoFilter.checked;
  const onlyPriorityHigh = priorityHighFilter.checked;

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.city.toLowerCase().includes(searchText) ||
      client.storeName.toLowerCase().includes(searchText) ||
      client.clientType.toLowerCase().includes(searchText);
    const matchesCity = !selectedCity || client.city === selectedCity;
    const matchesClientType =
      !selectedClientType || getClientStatus(client) === selectedClientType;
    const matchesPurchase = !onlyPurchaseNo || client.purchaseStatus === "No";
    const matchesPriority = !onlyPriorityHigh || client.priority === "High";

    return matchesSearch && matchesCity && matchesClientType && matchesPurchase && matchesPriority;
  });

  if (filteredClients.length === 0) {
    const emptyMessage =
      clients.length === 0 && searchText === ""
        ? "No clients yet. Add your first client above."
        : "No matching clients found.";

    clientCards.innerHTML = `<article class="empty-state">${emptyMessage}</article>`;
    return;
  }

  clientCards.innerHTML = filteredClients
    .map((client) => {
      const orderSummary = getOrderSummary(client.orderHistory);

      return `
        <article class="client-entry-card">
          <div class="client-entry-header">
            <div>
              <h3>${escapeHtml(client.storeName)}</h3>
              <p>${escapeHtml(client.city)}</p>
            </div>
            <div class="client-entry-tags">
              <span class="client-tag">${escapeHtml(client.clientType || "Other")}</span>
              <span class="client-tag priority-${(client.priority || "none").toLowerCase()}">${escapeHtml(client.priority || "No priority")}</span>
            </div>
          </div>
          <div class="client-entry-grid">
            <div><span>Created</span><strong>${formatDate(client.createdDate)}</strong></div>
            <div><span>Store phone</span><strong>${escapeHtml(client.storePhone || "-")}</strong></div>
            <div><span>Owner</span><strong>${escapeHtml(client.ownerName || "-")}</strong></div>
            <div><span>Owner phone</span><strong>${escapeHtml(client.ownerPhone || "-")}</strong></div>
            <div><span>Manager</span><strong>${escapeHtml(client.managerName || "-")}</strong></div>
            <div><span>Manager phone</span><strong>${escapeHtml(client.managerPhone || "-")}</strong></div>
            <div><span>Email</span><strong>${escapeHtml(client.email || "-")}</strong></div>
            <div><span>Next visit</span><strong>${formatDate(client.nextVisitDate)}</strong></div>
            <div><span>Last tasting</span><strong>${formatDate(client.lastTastingDate)}</strong></div>
            <div><span>Last order</span><strong>${formatDate(orderSummary.lastOrderDate)}</strong></div>
            <div><span>Total sales</span><strong>${formatCurrency(orderSummary.totalSalesAmount)}</strong></div>
            <div><span>Visits</span><strong>${client.visitCount || 0}</strong></div>
          </div>
          <p class="client-entry-notes">${escapeHtml(client.notes || "No notes yet.")}</p>
          <div class="table-actions">
            <button type="button" data-action="set-type" data-id="${client.id}">Set Client Type</button>
            <button type="button" data-action="set-priority" data-id="${client.id}">Set Priority</button>
            <button type="button" data-action="tasting" data-id="${client.id}">Add Tasting</button>
            <button type="button" data-action="visit" data-id="${client.id}">Add Visit</button>
            <button type="button" data-action="order" data-id="${client.id}">New Order</button>
            <button type="button" data-action="details" data-id="${client.id}">View Details</button>
            <button type="button" data-action="tastings" data-id="${client.id}">View Tastings</button>
            <button type="button" data-action="history" data-id="${client.id}">View History</button>
            <button type="button" data-action="edit" data-id="${client.id}">Edit</button>
            <button type="button" class="delete-button" data-action="delete" data-id="${client.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");

  clientCards.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const { action, id } = button.dataset;

      if (action === "edit") {
        editClient(id);
      }

      if (action === "details") {
        showDetails(id);
      }

      if (action === "set-type") {
        setClientType(id);
      }

      if (action === "set-priority") {
        setPriority(id);
      }

      if (action === "visit") {
        addVisit(id);
      }

      if (action === "tasting") {
        addTasting(id);
      }

      if (action === "tastings") {
        showTastings(id);
      }

      if (action === "history") {
        showHistory(id);
      }

      if (action === "delete") {
        deleteClient(id);
      }
    });
  });
}

function renderTodayVisits() {
  const today = getTodayString();
  const todayClients = clients.filter((client) => client.nextVisitDate === today);

  if (todayClients.length === 0) {
    todayVisitsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No visits scheduled for today.</td>
      </tr>
    `;
    return;
  }

  todayVisitsTableBody.innerHTML = todayClients
    .map((client) => {
      return `
        <tr>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${escapeHtml(client.city)}</td>
          <td>${escapeHtml(client.priority || "-")}</td>
          <td>${formatDate(client.lastVisitDate)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderInactiveVisits() {
  const inactiveClients = clients.filter((client) => {
    if (!client.lastVisitDate) {
      return false;
    }

    return daysSince(client.lastVisitDate) > 14;
  });

  if (inactiveClients.length === 0) {
    inactiveVisitsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No clients waiting more than 14 days.</td>
      </tr>
    `;
    return;
  }

  inactiveVisitsTableBody.innerHTML = inactiveClients
    .map((client) => {
      return `
        <tr>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${escapeHtml(client.city)}</td>
          <td>${formatDate(client.lastVisitDate)}</td>
          <td>${escapeHtml(client.priority || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderInactiveOrders() {
  const inactiveOrders = clients.filter((client) => {
    if (client.purchaseStatus !== "Yes" || !client.lastOrderDate) {
      return false;
    }

    return daysSince(client.lastOrderDate) > 30;
  });

  if (inactiveOrders.length === 0) {
    inactiveOrdersTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No clients waiting more than 30 days since last order.</td>
      </tr>
    `;
    return;
  }

  inactiveOrdersTableBody.innerHTML = inactiveOrders
    .map((client) => {
      return `
        <tr>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${escapeHtml(client.city)}</td>
          <td>${formatDate(client.lastOrderDate)}</td>
          <td>${escapeHtml(client.priority || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderDifficultClients() {
  const difficultClients = clients.filter((client) => {
    return client.purchaseStatus === "No" && (client.visitCount || 0) >= 3;
  });

  if (difficultClients.length === 0) {
    difficultClientsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No difficult clients right now.</td>
      </tr>
    `;
    return;
  }

  difficultClientsTableBody.innerHTML = difficultClients
    .map((client) => {
      return `
        <tr>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${escapeHtml(client.city)}</td>
          <td>${escapeHtml(client.priority || "-")}</td>
          <td>${client.visitCount || 0}</td>
          <td>${formatDate(client.lastVisitDate)}</td>
          <td>${escapeHtml(client.notes || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTopClients() {
  const rankedClients = clients
    .map((client) => {
      return {
        client,
        summary: getOrderSummary(client.orderHistory)
      };
    })
    .filter((item) => item.summary.totalSalesAmount > 0)
    .sort((a, b) => b.summary.totalSalesAmount - a.summary.totalSalesAmount);

  if (rankedClients.length === 0) {
    topClientsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No sales data yet.</td>
      </tr>
    `;
    return;
  }

  topClientsTableBody.innerHTML = rankedClients
    .map(({ client, summary }) => {
      return `
        <tr>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${escapeHtml(client.city)}</td>
          <td>${formatCurrency(summary.totalSalesAmount)}</td>
          <td>${summary.totalCases}</td>
          <td>${formatDate(summary.lastOrderDate)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderRouteByCity() {
  if (clients.length === 0) {
    routeByCity.innerHTML = `<article class="empty-state">No clients available yet.</article>`;
    return;
  }

  const groupedClients = clients.reduce((groups, client) => {
    const city = client.city || "No city";

    if (!groups[city]) {
      groups[city] = [];
    }

    groups[city].push(client);
    return groups;
  }, {});

  const sortedCities = Object.keys(groupedClients).sort((a, b) => a.localeCompare(b));

  routeByCity.innerHTML = sortedCities
    .map((city) => {
      const cityRows = groupedClients[city]
        .sort((a, b) => a.storeName.localeCompare(b.storeName))
        .map((client) => {
          return `
            <tr>
              <td>${escapeHtml(client.storeName)}</td>
              <td>${escapeHtml(getClientStatus(client))}</td>
              <td>${escapeHtml(client.priority || "-")}</td>
              <td>${formatDate(client.nextVisitDate)}</td>
              <td>${formatDate(client.lastVisitDate)}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <article class="route-city">
          <h3>${escapeHtml(city)}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Client type</th>
                  <th>Priority</th>
                  <th>Next visit</th>
                  <th>Last visit</th>
                </tr>
              </thead>
              <tbody>
                ${cityRows}
              </tbody>
            </table>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFollowupView() {
  updateFollowupCityFilter();

  const selectedCity = followupCityFilter.value;
  const activeClients = clients.filter((client) => {
    const matchesActive = getClientStatus(client) === "Active client";
    const matchesCity = !selectedCity || client.city === selectedCity;
    return matchesActive && matchesCity;
  });

  if (activeClients.length === 0) {
    const emptyMessage = clients.some((client) => getClientStatus(client) === "Active client")
      ? "No active clients found for this city."
      : "No active clients yet.";

    followupTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">${emptyMessage}</td>
      </tr>
    `;
    return;
  }

  followupTableBody.innerHTML = activeClients
    .map((client) => {
      return `
        <tr>
          <td>${escapeHtml(client.city)}</td>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${formatDate(client.nextVisitDate)}</td>
          <td>${escapeHtml(client.tastingStatus || "-")}</td>
          <td>${escapeHtml(client.purchaseStatus || "-")}</td>
          <td>${escapeHtml(client.productsPurchased || "-")}</td>
          <td>${escapeHtml(client.notes || "-")}</td>
          <td>${client.visitCount || 0}</td>
        </tr>
      `;
    })
    .join("");
}

function updateCityFilter() {
  const currentValue = cityFilter.value;
  const cities = [...new Set(clients.map((client) => client.city).filter(Boolean))].sort();

  cityFilter.innerHTML = `
    <option value="">All cities</option>
    ${cities.map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join("")}
  `;

  cityFilter.value = cities.includes(currentValue) ? currentValue : "";
}

function updateFollowupCityFilter() {
  const currentValue = followupCityFilter.value;
  const cities = [
    ...new Set(
      clients
        .filter((client) => getClientStatus(client) === "Active client")
        .map((client) => client.city)
        .filter(Boolean)
    )
  ].sort();

  followupCityFilter.innerHTML = `
    <option value="">All active client cities</option>
    ${cities.map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join("")}
  `;

  followupCityFilter.value = cities.includes(currentValue) ? currentValue : "";
}

function renderDashboard() {
  const today = getTodayString();

  const overdueVisits = clients.filter((client) => {
    return client.nextVisitDate && client.nextVisitDate < today;
  }).length;
  const tastingsToday = clients.filter((client) => client.tastingDate === today).length;
  const visitsToday = clients.filter((client) => client.nextVisitDate === today).length;
  const overdueFollowups = clients.filter((client) => {
    return client.nextVisitDate && client.nextVisitDate < today;
  }).length;
  const activeClients = clients.filter((client) => getClientStatus(client) === "Active client").length;
  const prospects = clients.length - activeClients;

  overdueVisitsElement.textContent = overdueVisits;
  tastingsTodayElement.textContent = tastingsToday;
  visitsTodayElement.textContent = visitsToday;
  overdueFollowupsElement.textContent = overdueFollowups;
  activeClientsElement.textContent = activeClients;
  prospectsElement.textContent = prospects;
}

function editClient(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  clientIdInput.value = client.id;
  storeNameInput.value = client.storeName;
  addressInput.value = client.address || "";
  cityInput.value = client.city;
  storePhoneInput.value = client.storePhone || "";
  ownerNameInput.value = client.ownerName || "";
  ownerPhoneInput.value = client.ownerPhone || "";
  managerNameInput.value = client.managerName || "";
  managerPhoneInput.value = client.managerPhone || "";
  emailInput.value = client.email || "";

  formTitle.textContent = "Edit client";
  saveButton.textContent = "Update client";
  cancelButton.classList.remove("hidden");
  storeNameInput.focus();
}

async function addVisit(id) {
  const clientIndex = clients.findIndex((item) => item.id === id);

  if (clientIndex === -1) {
    return;
  }

  const defaultDate = getTodayString();
  const enteredDate = window.prompt("Enter visit date (YYYY-MM-DD):", defaultDate);

  if (enteredDate === null) {
    return;
  }

  const selectedVisitDate = enteredDate.trim() || defaultDate;

  if (!isValidDateInput(selectedVisitDate)) {
    window.alert("Please enter a valid date in YYYY-MM-DD format.");
    return;
  }

  const enteredNote = window.prompt("Enter a short visit note:", "");

  if (enteredNote === null) {
    return;
  }

  const visitNote = enteredNote.trim();
  const suggestedNextVisit = clients[clientIndex].nextVisitDate || "";
  const enteredNextVisit = window.prompt(
    "Enter next visit date (optional YYYY-MM-DD):",
    suggestedNextVisit
  );

  if (enteredNextVisit === null) {
    return;
  }

  const nextVisitDate = enteredNextVisit.trim();

  if (nextVisitDate && !isValidDateInput(nextVisitDate)) {
    window.alert("Please enter a valid next visit date in YYYY-MM-DD format.");
    return;
  }

  const currentCount = clients[clientIndex].visitCount || 0;
  clients[clientIndex].visitCount = currentCount + 1;
  clients[clientIndex].lastVisitDate = selectedVisitDate;
  clients[clientIndex].nextVisitDate = nextVisitDate;
  clients[clientIndex].notes = visitNote || clients[clientIndex].notes || "";
  clients[clientIndex].visitHistory = clients[clientIndex].visitHistory || [];
  clients[clientIndex].visitHistory.unshift({
    date: selectedVisitDate,
    note: visitNote
  });

  try {
    setSyncStatus("Saving visit to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Visit saved to Firestore.");
  } catch (error) {
    console.error(error);
    setSyncStatus("Could not save visit.");
    window.alert("Could not save this visit to Firestore.");
  }
}

function openOrderForm(id) {
  if (!ORDERS_ENABLED) {
    window.alert("Add Delivery is temporarily disabled.");
    return;
  }

  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  orderFormTitle.textContent = `Add delivery - ${client.storeName}`;
  orderClientIdInput.value = client.id;
  orderDateInput.value = getTodayString();
  orderLines.innerHTML = "";
  addOrderLine();
  renderOrderTotal();
  orderFormCard.classList.remove("hidden");
  orderDateInput.focus();
}

function closeOrderForm() {
  orderForm.reset();
  orderClientIdInput.value = "";
  orderLines.innerHTML = "";
  renderOrderTotal();
  orderFormCard.classList.add("hidden");
}

function handleOrderLineClick(event) {
  const removeButton = event.target.closest("[data-remove-line]");

  if (!removeButton) {
    return;
  }

  const lineCard = removeButton.closest(".delivery-line-card");

  if (!lineCard) {
    return;
  }

  lineCard.remove();

  if (orderLines.children.length === 0) {
    addOrderLine();
  }

  renderOrderTotal();
}

function addOrderLine(line = {}) {
  const lineCard = document.createElement("article");
  lineCard.className = "delivery-line-card";
  lineCard.innerHTML = `
    <label>
      Product
      <select class="delivery-line-product" required>
        <option value="">Select product</option>
        ${PRODUCT_OPTIONS.map((option) => {
          const selected = option === line.productName ? "selected" : "";
          return `<option value="${escapeHtml(option)}" ${selected}>${escapeHtml(option)}</option>`;
        }).join("")}
      </select>
    </label>
    <label>
      Quantity
      <input type="number" class="delivery-line-quantity" min="0" step="1" value="${escapeHtml(line.quantity || 0)}" required />
    </label>
    <label>
      Price
      <input type="number" class="delivery-line-price" min="0" step="0.01" value="${escapeHtml(line.price || 0)}" required />
    </label>
    <label class="free-check">
      <input type="checkbox" class="delivery-line-free" ${line.isFree ? "checked" : ""} />
      Free product
    </label>
    <button type="button" class="secondary line-remove-button" data-remove-line>Remove</button>
  `;

  orderLines.appendChild(lineCard);
}

function getOrderLineItemsFromForm() {
  return Array.from(orderLines.querySelectorAll(".delivery-line-card"))
    .map((lineCard) => {
      const productName = lineCard.querySelector(".delivery-line-product").value;
      const quantity = Number(lineCard.querySelector(".delivery-line-quantity").value) || 0;
      const price = Number(lineCard.querySelector(".delivery-line-price").value) || 0;
      const isFree = lineCard.querySelector(".delivery-line-free").checked;

      return {
        productName,
        quantity,
        price,
        isFree,
        lineTotal: isFree ? 0 : quantity * price
      };
    })
    .filter((line) => line.productName && line.quantity > 0);
}

function renderOrderTotal() {
  const totalAmount = getOrderLineItemsFromForm().reduce((sum, line) => {
    return sum + line.lineTotal;
  }, 0);

  orderTotalAmount.textContent = formatCurrency(totalAmount);
}

async function handleOrderSubmit(event) {
  if (!ORDERS_ENABLED) {
    event.preventDefault();
    window.alert("Add Delivery is temporarily disabled.");
    return;
  }

  event.preventDefault();

  const clientId = orderClientIdInput.value;
  const clientIndex = clients.findIndex((item) => item.id === clientId);

  if (clientIndex === -1) {
    return;
  }

  const orderDate = orderDateInput.value;

  if (!isValidDateInput(orderDate)) {
    window.alert("Please enter a valid delivery date.");
    return;
  }

  const lineItems = getOrderLineItemsFromForm();

  if (lineItems.length === 0) {
    window.alert("Please add at least one product line.");
    return;
  }

  const totalAmount = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);

  clients[clientIndex].orderHistory = clients[clientIndex].orderHistory || [];
  clients[clientIndex].orderHistory.unshift({
    id: crypto.randomUUID(),
    date: orderDate,
    lineItems,
    totalAmount
  });
  clients[clientIndex].lastOrderDate = orderDate;
  clients[clientIndex].purchaseStatus = "Yes";
  clients[clientIndex].productsPurchased = lineItems.map((line) => line.productName).join(", ");

  try {
    setSyncStatus("Saving delivery to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Delivery saved to Firestore.");
    closeOrderForm();
  } catch (error) {
    console.error(error);
    setSyncStatus("Could not save delivery.");
    window.alert("Could not save this delivery to Firestore.");
  }
}

async function deleteClient(id) {
  const confirmed = window.confirm("Delete this client?");

  if (!confirmed) {
    return;
  }

  try {
    setSyncStatus("Deleting client from Firestore...");
    await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
    console.log("client deleted", { id });
    resetForm();
    setSyncStatus("Client deleted from Firestore.");
  } catch (error) {
    console.error("deleting client error", error);
    console.error(error);
    setSyncStatus("Could not delete client.");
    window.alert("Could not delete this client from Firestore.");
  }
}

function resetForm() {
  form.reset();
  clientIdInput.value = "";
  formTitle.textContent = "Add client";
  saveButton.textContent = "Save client";
  cancelButton.classList.add("hidden");
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

function getTodayString() {
  return new Date().toLocaleDateString("en-CA");
}

function isValidDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function daysSince(dateString) {
  const visitDate = new Date(`${dateString}T00:00:00`);
  const today = new Date(`${getTodayString()}T00:00:00`);
  const diffMs = today - visitDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getClientStatus(client) {
  return client.purchaseStatus === "Yes" ? "Active client" : "Prospect";
}

function showHistory(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  historyTitle.textContent = `Visit history - ${client.storeName}`;

  if (!client.visitHistory || client.visitHistory.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="2" class="empty-state">No visit history yet.</td>
      </tr>
    `;
  } else {
    historyTableBody.innerHTML = client.visitHistory
      .map((visit) => {
        return `
          <tr>
            <td>${escapeHtml(formatDate(visit.date))}</td>
            <td>${escapeHtml(visit.note || "-")}</td>
          </tr>
        `;
      })
      .join("");
  }

  historyCard.classList.remove("hidden");
}

function closeHistory() {
  historyCard.classList.add("hidden");
}

function showDetails(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  const orderSummary = getOrderSummary(client.orderHistory);

  detailsTitle.textContent = `Client details - ${client.storeName}`;
  detailsGrid.innerHTML = `
    <article class="detail-item">
      <p class="detail-label">Store name</p>
      <p class="detail-value">${escapeHtml(client.storeName)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">City</p>
      <p class="detail-value">${escapeHtml(client.city)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Created date</p>
      <p class="detail-value">${formatDate(client.createdDate)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Store phone</p>
      <p class="detail-value">${escapeHtml(client.storePhone || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Owner phone</p>
      <p class="detail-value">${escapeHtml(client.ownerPhone || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Manager phone</p>
      <p class="detail-value">${escapeHtml(client.managerPhone || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Email</p>
      <p class="detail-value">${escapeHtml(client.email || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Last tasting</p>
      <p class="detail-value">${formatDate(client.lastTastingDate)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Client type</p>
      <p class="detail-value">${escapeHtml(client.clientType || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Priority</p>
      <p class="detail-value">${escapeHtml(client.priority || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Last visit</p>
      <p class="detail-value">${formatDate(client.lastVisitDate)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Next visit</p>
      <p class="detail-value">${formatDate(client.nextVisitDate)}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Total sales</p>
      <p class="detail-value">${formatCurrency(orderSummary.totalSalesAmount)}</p>
    </article>
  `;

  detailsCard.classList.remove("hidden");
}

function closeDetails() {
  detailsCard.classList.add("hidden");
}

async function setClientType(id) {
  const clientIndex = clients.findIndex((item) => item.id === id);

  if (clientIndex === -1) {
    return;
  }

  const currentType = clients[clientIndex].clientType || "Other";
  const enteredType = window.prompt(
    "Enter client type: Bar, Restaurant, Liquor store, Supermarket, or Other",
    currentType
  );

  if (enteredType === null) {
    return;
  }

  const nextType = enteredType.trim() || currentType;
  clients[clientIndex].clientType = nextType;

  try {
    setSyncStatus("Saving client type to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Client type saved.");
  } catch (error) {
    console.error(error);
    setSyncStatus("Could not save client type.");
    window.alert("Could not save client type.");
  }
}

async function setPriority(id) {
  const clientIndex = clients.findIndex((item) => item.id === id);

  if (clientIndex === -1) {
    return;
  }

  const currentPriority = clients[clientIndex].priority || "Medium";
  const enteredPriority = window.prompt(
    "Enter priority: High, Medium, or Low",
    currentPriority
  );

  if (enteredPriority === null) {
    return;
  }

  const nextPriority = enteredPriority.trim() || currentPriority;
  clients[clientIndex].priority = nextPriority;

  try {
    setSyncStatus("Saving priority to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Priority saved.");
  } catch (error) {
    console.error(error);
    setSyncStatus("Could not save priority.");
    window.alert("Could not save priority.");
  }
}

async function addTasting(id) {
  const clientIndex = clients.findIndex((item) => item.id === id);

  if (clientIndex === -1) {
    return;
  }

  const defaultDate = getTodayString();
  const tastingDate = promptForValue("Enter tasting date (YYYY-MM-DD):", defaultDate);

  if (tastingDate === null) {
    return;
  }

  if (!isValidDateInput(tastingDate)) {
    window.alert("Please enter a valid date in YYYY-MM-DD format.");
    return;
  }

  const tastingNotes = promptForValue("Enter tasting notes:", "");
  if (tastingNotes === null) {
    return;
  }

  const tastingResult = promptForValue("Enter result (interested, no interest, sale):", "interested");
  if (tastingResult === null) {
    return;
  }

  clients[clientIndex].tastingHistory = clients[clientIndex].tastingHistory || [];
  clients[clientIndex].tastingHistory.unshift({
    date: tastingDate,
    notes: tastingNotes,
    result: tastingResult
  });
  clients[clientIndex].lastTastingDate = tastingDate;
  clients[clientIndex].tastingDate = tastingDate;
  clients[clientIndex].tastingStatus = "Yes";

  try {
    setSyncStatus("Saving tasting to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Tasting saved to Firestore.");
    showTastings(id);
  } catch (error) {
    console.error(error);
    setSyncStatus("Could not save tasting.");
    window.alert("Could not save this tasting to Firestore.");
  }
}

function showTastings(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  tastingTitle.textContent = `Tasting history - ${client.storeName}`;

  if (!client.tastingHistory || client.tastingHistory.length === 0) {
    tastingTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">No tasting history yet.</td>
      </tr>
    `;
  } else {
    tastingTableBody.innerHTML = client.tastingHistory
      .map((tasting) => {
        return `
          <tr>
            <td>${formatDate(tasting.date)}</td>
            <td>${escapeHtml(tasting.result || "-")}</td>
            <td>${escapeHtml(tasting.notes || "-")}</td>
          </tr>
        `;
      })
      .join("");
  }

  tastingCard.classList.remove("hidden");
}

function closeTasting() {
  tastingCard.classList.add("hidden");
}

function promptForValue(message, defaultValue) {
  const enteredValue = window.prompt(message, defaultValue);

  if (enteredValue === null) {
    return null;
  }

  return enteredValue.trim();
}

function getOrderSummary(orderHistory) {
  if (!orderHistory || orderHistory.length === 0) {
    return {
      lastOrderDate: "",
      totalOrders: 0,
      totalCases: 0,
      totalSalesAmount: 0
    };
  }

  return orderHistory.reduce(
    (summary, order, index) => {
      const lineItems = getNormalizedOrderLineItems(order);
      const totalCases = lineItems.reduce((sum, line) => sum + line.quantity, 0);
      const totalAmount = getOrderTotalAmount(order);

      return {
        lastOrderDate: index === 0 ? order.date : summary.lastOrderDate,
        totalOrders: summary.totalOrders + 1,
        totalCases: summary.totalCases + totalCases,
        totalSalesAmount: summary.totalSalesAmount + totalAmount
      };
    },
    {
      lastOrderDate: "",
      totalOrders: 0,
      totalCases: 0,
      totalSalesAmount: 0
    }
  );
}

function getNormalizedOrderLineItems(order) {
  if (order.lineItems && order.lineItems.length > 0) {
    return order.lineItems.map((line) => {
      const quantity = Number(line.quantity) || 0;
      const price = Number(line.price) || 0;
      const isFree = Boolean(line.isFree);

      return {
        productName: line.productName || "-",
        quantity,
        price,
        isFree,
        lineTotal: isFree ? 0 : quantity * price
      };
    });
  }

  const legacyQuantity = Number(order.quantityCases) || 0;
  const legacyPrice = Number(order.pricePerCase) || 0;
  const legacyIsFree = String(order.freeProduct || "").toLowerCase() === "yes";

  return [
    {
      productName: order.productName || "-",
      quantity: legacyQuantity,
      price: legacyPrice,
      isFree: legacyIsFree,
      lineTotal: legacyIsFree ? 0 : legacyQuantity * legacyPrice
    }
  ];
}

function getOrderTotalAmount(order) {
  if (typeof order.totalAmount === "number") {
    return order.totalAmount;
  }

  return getNormalizedOrderLineItems(order).reduce((sum, line) => {
    return sum + line.lineTotal;
  }, 0);
}

function renderOrderBubbles(orderHistory) {
  if (!orderHistory || orderHistory.length === 0) {
    return `<article class="empty-state compact-empty">No orders yet.</article>`;
  }

  return orderHistory
    .map((order) => {
      const lineItems = getNormalizedOrderLineItems(order);

      return `
        <article class="delivery-history-card">
          <div class="delivery-history-header">
            <strong>${formatDate(order.date)}</strong>
            <span>${formatCurrency(getOrderTotalAmount(order))}</span>
          </div>
          <div class="delivery-history-lines">
            ${lineItems
              .map((line) => {
                return `
                  <div class="delivery-history-line">
                    <div>
                      <strong>${escapeHtml(line.productName)}</strong>
                      <span>${line.isFree ? "Free product" : "Paid line"}</span>
                    </div>
                    <div>
                      <span>Qty: ${line.quantity}</span>
                      <span>Price: ${formatCurrency(line.price)}</span>
                      <span>Line total: ${formatCurrency(line.lineTotal)}</span>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}

function setSyncStatus(message) {
  syncStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

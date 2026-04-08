import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch
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
const ownerNameInput = document.getElementById("ownerName");
const managerNameInput = document.getElementById("managerName");
const tastingStatusInput = document.getElementById("tastingStatus");
const tastingDateInput = document.getElementById("tastingDate");
const purchaseStatusInput = document.getElementById("purchaseStatus");
const productsPurchasedInput = document.getElementById("productsPurchased");
const priorityInput = document.getElementById("priority");
const phoneInput = document.getElementById("phone");
const notesInput = document.getElementById("notes");
const nextVisitDateInput = document.getElementById("nextVisitDate");
const clientTypeInput = document.getElementById("clientType");
const tableBody = document.getElementById("client-table-body");
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
const deliveryCard = document.getElementById("delivery-card");
const deliveryTitle = document.getElementById("delivery-title");
const deliveryTableBody = document.getElementById("delivery-table-body");
const closeDeliveryButton = document.getElementById("close-delivery-button");
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

let clients = [];
let isFirestoreReady = false;

form.addEventListener("submit", handleSubmit);
exportButton.addEventListener("click", exportData);
importButton.addEventListener("click", openImportPicker);
importFileInput.addEventListener("change", importData);
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
closeDeliveryButton.addEventListener("click", closeDelivery);

renderClients();
initializeFirebase();

function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    console.log("firebase initialized");
    db = getFirestore(app);
    clientsCollection = collection(db, CLIENTS_COLLECTION);
    subscribeToClients();
  } catch (error) {
    console.error("Firebase initialization error:", error);
    setSyncStatus("Firebase could not start.");
    window.alert("Firebase could not start. Check the console for the exact error.");
  }
}

function subscribeToClients() {
  if (!clientsCollection) {
    console.error("Firestore collection is not ready.");
    setSyncStatus("Firestore is not ready.");
    return;
  }

  setSyncStatus("Loading clients from Firestore...");

  onSnapshot(
    clientsCollection,
    (snapshot) => {
      isFirestoreReady = true;
      clients = snapshot.docs
        .map((item) => normalizeClient({ id: item.id, ...item.data() }))
        .sort((a, b) => a.storeName.localeCompare(b.storeName));

      setSyncStatus(`Firestore connected. ${clients.length} client${clients.length === 1 ? "" : "s"} loaded.`);
      renderClients();
    },
    (error) => {
      isFirestoreReady = false;
      console.error("Firestore connection error:", error);
      console.error(error);
      setSyncStatus("Could not load Firestore data.");
      window.alert("Could not connect to Firestore. Check your Firebase project settings and rules.");
    }
  );
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
    return;
  }

  try {
    const clientDoc = doc(db, CLIENTS_COLLECTION, client.id);
    await setDoc(clientDoc, client);
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
  if (!ensureFirestoreReady()) {
    importFileInput.value = "";
    return;
  }

  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const parsedData = JSON.parse(reader.result);
      const importedClients = Array.isArray(parsedData) ? parsedData : parsedData.clients;

      if (!Array.isArray(importedClients)) {
        throw new Error("Invalid backup file.");
      }

      const confirmed = window.confirm(
        "Importing data will replace your current Firestore clients. Do you want to continue?"
      );

      if (!confirmed) {
        importFileInput.value = "";
        return;
      }

      setSyncStatus("Importing data to Firestore...");

      const existingDocs = await getDocs(clientsCollection);
      const batch = writeBatch(db);

      existingDocs.forEach((item) => {
        batch.delete(item.ref);
      });

      importedClients.map(normalizeClient).forEach((client) => {
        const clientDoc = doc(db, CLIENTS_COLLECTION, client.id);
        batch.set(clientDoc, client);
      });

      await batch.commit();

      resetForm();
      closeHistory();
      closeDetails();
      closeTasting();
      closeDelivery();
      setSyncStatus("Import complete. Firestore data updated.");
      window.alert("Data imported successfully.");
    } catch (error) {
      console.error("Firestore import error:", error);
      console.error(error);
      setSyncStatus("Import failed.");
      window.alert("Could not import that file. Please choose a valid CRM backup file.");
    }

    importFileInput.value = "";
  };

  reader.readAsText(file);
}

function normalizeClient(client) {
  return {
    id: client.id || crypto.randomUUID(),
    city: client.city || "",
    storeName: client.storeName || "",
    address: client.address || "",
    ownerName: client.ownerName || "",
    managerName: client.managerName || "",
    tastingStatus: client.tastingStatus || "",
    tastingDate: client.tastingDate || "",
    purchaseStatus: client.purchaseStatus || "",
    productsPurchased: client.productsPurchased || "",
    priority: client.priority || "",
    phone: client.phone || "",
    notes: client.notes || "",
    nextVisitDate: client.nextVisitDate || "",
    clientType: client.clientType || "",
    visitCount: client.visitCount || 1,
    lastVisitDate: client.lastVisitDate || "",
    lastOrderDate: client.lastOrderDate || "",
    createdDate: client.createdDate || getTodayString(),
    lastTastingDate: client.lastTastingDate || client.tastingDate || "",
    visitHistory: client.visitHistory || [],
    tastingHistory: client.tastingHistory || [],
    deliveryHistory: client.deliveryHistory || []
  };
}

async function handleSubmit(event) {
  event.preventDefault();

  const existingClient = clients.find((item) => item.id === clientIdInput.value);

  const client = normalizeClient({
    id: clientIdInput.value || crypto.randomUUID(),
    city: cityInput.value.trim(),
    storeName: storeNameInput.value.trim(),
    address: addressInput.value.trim(),
    ownerName: ownerNameInput.value.trim(),
    managerName: managerNameInput.value.trim(),
    tastingStatus: tastingStatusInput.value,
    tastingDate: tastingDateInput.value,
    purchaseStatus: purchaseStatusInput.value,
    productsPurchased: productsPurchasedInput.value.trim(),
    priority: priorityInput.value,
    phone: phoneInput.value.trim(),
    notes: notesInput.value.trim(),
    nextVisitDate: nextVisitDateInput.value,
    clientType: clientTypeInput.value,
    visitCount: existingClient ? existingClient.visitCount || 1 : 1,
    lastVisitDate: existingClient ? existingClient.lastVisitDate || "" : "",
    lastOrderDate: existingClient ? existingClient.lastOrderDate || "" : "",
    createdDate: existingClient ? existingClient.createdDate || getTodayString() : getTodayString(),
    lastTastingDate: existingClient
      ? existingClient.lastTastingDate || existingClient.tastingDate || tastingDateInput.value
      : tastingDateInput.value,
    visitHistory: existingClient ? existingClient.visitHistory || [] : [],
    tastingHistory: existingClient ? existingClient.tastingHistory || [] : [],
    deliveryHistory: existingClient ? existingClient.deliveryHistory || [] : []
  });

  try {
    setSyncStatus("Saving client to Firestore...");
    await saveClientToFirestore(client);
    resetForm();
    setSyncStatus("Client saved to Firestore.");
  } catch (error) {
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

    tableBody.innerHTML = `
      <tr>
        <td colspan="15" class="empty-state">${emptyMessage}</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredClients
    .map((client) => {
      const deliverySummary = getDeliverySummary(client.deliveryHistory);

      return `
        <tr>
          <td>${escapeHtml(client.city)}</td>
          <td>${escapeHtml(client.storeName)}</td>
          <td>${formatDate(client.createdDate)}</td>
          <td>${escapeHtml(client.phone)}</td>
          <td>${formatDate(client.lastTastingDate)}</td>
          <td>${formatDate(deliverySummary.lastDeliveryDate)}</td>
          <td>${deliverySummary.totalDeliveries}</td>
          <td>${deliverySummary.totalCases}</td>
          <td>${formatCurrency(deliverySummary.totalSalesAmount)}</td>
          <td>${client.visitCount || 0}</td>
          <td>${formatDate(client.lastVisitDate)}</td>
          <td>${escapeHtml(client.notes || "-")}</td>
          <td>${formatDate(client.nextVisitDate)}</td>
          <td>${escapeHtml(client.clientType)}</td>
          <td>
            <div class="table-actions">
              <button type="button" data-action="details" data-id="${client.id}">View Details</button>
              <button type="button" data-action="tasting" data-id="${client.id}">Add Tasting</button>
              <button type="button" data-action="visit" data-id="${client.id}">Add Visit</button>
              <button type="button" data-action="delivery" data-id="${client.id}">Add Delivery</button>
              <button type="button" data-action="tastings" data-id="${client.id}">View Tastings</button>
              <button type="button" data-action="history" data-id="${client.id}">View History</button>
              <button type="button" data-action="deliveries" data-id="${client.id}">View Deliveries</button>
              <button type="button" data-action="edit" data-id="${client.id}">Edit</button>
              <button type="button" class="delete-button" data-action="delete" data-id="${client.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tableBody.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const { action, id } = button.dataset;

      if (action === "edit") {
        editClient(id);
      }

      if (action === "details") {
        showDetails(id);
      }

      if (action === "visit") {
        addVisit(id);
      }

      if (action === "tasting") {
        addTasting(id);
      }

      if (action === "delivery") {
        addDelivery(id);
      }

      if (action === "tastings") {
        showTastings(id);
      }

      if (action === "history") {
        showHistory(id);
      }

      if (action === "deliveries") {
        showDeliveries(id);
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
        summary: getDeliverySummary(client.deliveryHistory)
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
          <td>${formatDate(summary.lastDeliveryDate)}</td>
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
  cityInput.value = client.city;
  storeNameInput.value = client.storeName;
  addressInput.value = client.address || "";
  ownerNameInput.value = client.ownerName || "";
  managerNameInput.value = client.managerName || "";
  tastingStatusInput.value = client.tastingStatus || "";
  tastingDateInput.value = client.tastingDate || "";
  purchaseStatusInput.value = client.purchaseStatus || "";
  productsPurchasedInput.value = client.productsPurchased || "";
  priorityInput.value = client.priority || "";
  phoneInput.value = client.phone;
  notesInput.value = "";
  nextVisitDateInput.value = client.nextVisitDate;
  clientTypeInput.value = client.clientType;

  formTitle.textContent = "Edit client";
  saveButton.textContent = "Update client";
  cancelButton.classList.remove("hidden");
  cityInput.focus();
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

  const currentCount = clients[clientIndex].visitCount || 0;
  clients[clientIndex].visitCount = currentCount + 1;
  clients[clientIndex].lastVisitDate = selectedVisitDate;
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

async function addDelivery(id) {
  const clientIndex = clients.findIndex((item) => item.id === id);

  if (clientIndex === -1) {
    return;
  }

  const defaultDate = getTodayString();
  const deliveryDate = promptForValue("Enter delivery date (YYYY-MM-DD):", defaultDate);

  if (deliveryDate === null) {
    return;
  }

  if (!isValidDateInput(deliveryDate)) {
    window.alert("Please enter a valid date in YYYY-MM-DD format.");
    return;
  }

  const productName = promptForValue("Enter product name:", "");
  if (productName === null) {
    return;
  }

  const quantityCases = promptForValue("Enter quantity of cases:", "0");
  if (quantityCases === null) {
    return;
  }

  const pricePerCase = promptForValue("Enter price per case:", "0");
  if (pricePerCase === null) {
    return;
  }

  const freeProduct = promptForValue("Free product? (Yes/No):", "No");
  if (freeProduct === null) {
    return;
  }

  const freeQuantity = promptForValue("Enter free quantity:", "0");
  if (freeQuantity === null) {
    return;
  }

  const deliveryNotes = promptForValue("Enter delivery notes:", "");
  if (deliveryNotes === null) {
    return;
  }

  clients[clientIndex].deliveryHistory = clients[clientIndex].deliveryHistory || [];
  clients[clientIndex].deliveryHistory.unshift({
    date: deliveryDate,
    productName,
    quantityCases,
    pricePerCase,
    freeProduct,
    freeQuantity,
    notes: deliveryNotes
  });
  clients[clientIndex].lastOrderDate = deliveryDate;
  clients[clientIndex].purchaseStatus = "Yes";
  clients[clientIndex].productsPurchased = productName || clients[clientIndex].productsPurchased || "";

  try {
    setSyncStatus("Saving delivery to Firestore...");
    await saveClientToFirestore(clients[clientIndex]);
    setSyncStatus("Delivery saved to Firestore.");
    showDeliveries(id);
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
    resetForm();
    setSyncStatus("Client deleted from Firestore.");
  } catch (error) {
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

  const deliverySummary = getDeliverySummary(client.deliveryHistory);

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
      <p class="detail-label">Phone</p>
      <p class="detail-value">${escapeHtml(client.phone || "-")}</p>
    </article>
    <article class="detail-item">
      <p class="detail-label">Last tasting</p>
      <p class="detail-value">${formatDate(client.lastTastingDate)}</p>
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
      <p class="detail-value">${formatCurrency(deliverySummary.totalSalesAmount)}</p>
    </article>
  `;

  detailsCard.classList.remove("hidden");
}

function closeDetails() {
  detailsCard.classList.add("hidden");
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

function showDeliveries(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    return;
  }

  deliveryTitle.textContent = `Delivery history - ${client.storeName}`;

  if (!client.deliveryHistory || client.deliveryHistory.length === 0) {
    deliveryTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No delivery history yet.</td>
      </tr>
    `;
  } else {
    deliveryTableBody.innerHTML = client.deliveryHistory
      .map((delivery) => {
        return `
          <tr>
            <td>${escapeHtml(formatDate(delivery.date))}</td>
            <td>${escapeHtml(delivery.productName || "-")}</td>
            <td>${escapeHtml(delivery.quantityCases || "-")}</td>
            <td>${escapeHtml(delivery.pricePerCase || "-")}</td>
            <td>${escapeHtml(delivery.freeProduct || "-")}</td>
            <td>${escapeHtml(delivery.freeQuantity || "-")}</td>
            <td>${escapeHtml(delivery.notes || "-")}</td>
          </tr>
        `;
      })
      .join("");
  }

  deliveryCard.classList.remove("hidden");
}

function closeDelivery() {
  deliveryCard.classList.add("hidden");
}

function promptForValue(message, defaultValue) {
  const enteredValue = window.prompt(message, defaultValue);

  if (enteredValue === null) {
    return null;
  }

  return enteredValue.trim();
}

function getDeliverySummary(deliveryHistory) {
  if (!deliveryHistory || deliveryHistory.length === 0) {
    return {
      lastDeliveryDate: "",
      totalDeliveries: 0,
      totalCases: 0,
      totalSalesAmount: 0
    };
  }

  return deliveryHistory.reduce(
    (summary, delivery, index) => {
      const quantityCases = Number(delivery.quantityCases) || 0;
      const pricePerCase = Number(delivery.pricePerCase) || 0;

      return {
        lastDeliveryDate: index === 0 ? delivery.date : summary.lastDeliveryDate,
        totalDeliveries: summary.totalDeliveries + 1,
        totalCases: summary.totalCases + quantityCases,
        totalSalesAmount: summary.totalSalesAmount + quantityCases * pricePerCase
      };
    },
    {
      lastDeliveryDate: "",
      totalDeliveries: 0,
      totalCases: 0,
      totalSalesAmount: 0
    }
  );
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

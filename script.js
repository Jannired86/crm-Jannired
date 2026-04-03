const STORAGE_KEY = "simple-crm-clients";

const form = document.getElementById("client-form");
const formTitle = document.getElementById("form-title");
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

let clients = loadClients();

form.addEventListener("submit", handleSubmit);
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

function loadClients() {
  const savedClients = localStorage.getItem(STORAGE_KEY);

  if (!savedClients) {
    return [];
  }

  return JSON.parse(savedClients).map((client) => {
    return {
      ...client,
      createdDate: client.createdDate || getTodayString(),
      lastTastingDate: client.lastTastingDate || client.tastingDate || "",
      tastingHistory: client.tastingHistory || []
    };
  });
}

function saveClients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function handleSubmit(event) {
  event.preventDefault();

  const existingClient = clients.find((item) => item.id === clientIdInput.value);

  const client = {
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
    lastTastingDate: existingClient ? existingClient.lastTastingDate || existingClient.tastingDate || tastingDateInput.value : tastingDateInput.value,
    visitHistory: existingClient ? existingClient.visitHistory || [] : [],
    tastingHistory: existingClient ? existingClient.tastingHistory || [] : [],
    deliveryHistory: existingClient ? existingClient.deliveryHistory || [] : []
  };

  const existingClientIndex = clients.findIndex((item) => item.id === client.id);

  if (existingClientIndex >= 0) {
    clients[existingClientIndex] = client;
  } else {
    clients.push(client);
  }

  saveClients();
  renderClients();
  resetForm();
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

function addVisit(id) {
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
  saveClients();
  renderClients();
}

function addDelivery(id) {
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

  saveClients();
  renderClients();
  showDeliveries(id);
}

function deleteClient(id) {
  const confirmed = window.confirm("Delete this client?");

  if (!confirmed) {
    return;
  }

  clients = clients.filter((client) => client.id !== id);
  saveClients();
  renderClients();
  resetForm();
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

function addTasting(id) {
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

  saveClients();
  renderClients();
  showTastings(id);
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

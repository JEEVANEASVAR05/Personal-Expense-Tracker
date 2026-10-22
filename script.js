const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");

const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");
const feedback = document.getElementById("feedback");
const filterInput = document.getElementById("filter");
const clearAllButton = document.getElementById("clear-all");

let transactions = [];

try {
  const saved = JSON.parse(localStorage.getItem("spendwise-transactions"));

  if (Array.isArray(saved)) {
    transactions = saved.filter(item =>
      item &&
      typeof item.id === "string" &&
      typeof item.description === "string" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      ["income", "expense"].includes(item.type) &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    );
  }
} catch {
  transactions = [];
}

function money(amount) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR"
  });
}

function saveTransactions() {
  try {
    localStorage.setItem(
      "spendwise-transactions",
      JSON.stringify(transactions)
    );
    return true;
  } catch {
    feedback.textContent = "Could not save data in this browser.";
    return false;
  }
}

function renderTransactions() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  balanceElement.textContent = money(income - expenses);
  incomeElement.textContent = money(income);
  expensesElement.textContent = money(expenses);

  transactionList.replaceChildren();

  const filter = filterInput.value;
  const visible = transactions.filter(item =>
    filter === "all" || item.type === filter
  );

  visible.forEach(item => {
    const row = document.createElement("li");
    row.className = "transaction";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.textContent = item.type === "income" ? "+" : "−";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const title = document.createElement("strong");
    title.textContent = item.description;

    const details = document.createElement("small");
    details.textContent = `${item.category} · ${item.date}`;

    info.append(title, details);

    const amountBox = document.createElement("div");
    amountBox.className = "transaction-amount " + item.type;
    amountBox.append(
      document.createTextNode(
        `${item.type === "income" ? "+" : "−"}${money(item.amount)}`
      )
    );

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete transaction ${item.description}`
    );

    deleteButton.addEventListener("click", () => {
      transactions = transactions.filter(tx => tx.id !== item.id);
      saveTransactions();
      renderTransactions();
      feedback.textContent = "Transaction deleted.";
    });

    amountBox.appendChild(deleteButton);
    row.append(icon, info, amountBox);
    transactionList.appendChild(row);
  });

  emptyMessage.hidden = visible.length > 0;
  clearAllButton.disabled = transactions.length === 0;
  clearAllButton.style.opacity = transactions.length === 0 ? "0.5" : "1";
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description) {
    feedback.textContent = "Please enter a description.";
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    feedback.textContent = "Enter a valid amount greater than zero.";
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    description,
    amount,
    type: typeInput.value,
    category: categoryInput.value,
    date: new Date().toLocaleDateString("en-IN")
  };

  transactions.unshift(transaction);
  saveTransactions();
  renderTransactions();

  form.reset();
  feedback.textContent = "Transaction added successfully!";
  descriptionInput.focus();
});

filterInput.addEventListener("change", renderTransactions);

clearAllButton.addEventListener("click", () => {
  if (transactions.length === 0) return;

  const confirmed = confirm("Delete all transactions? This cannot be undone.");

  if (confirmed) {
    transactions = [];
    saveTransactions();
    renderTransactions();
    feedback.textContent = "All transactions cleared.";
  }
});

renderTransactions();

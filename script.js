(() => {
  "use strict";

  const STORAGE_KEY = "todo-counter-app:v1";
  const MAX_REPEAT = 50; // safety cap for "Task 3" style input

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const hint = document.getElementById("hint");
  const list = document.getElementById("todo-list");
  const empty = document.getElementById("empty");
  const HINT_TEXT = hint.textContent;

  const ICON_DELETE =
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
  const ICON_EDIT =
    '<svg viewBox="0 0 24 24"><path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4z"/></svg>';
  const ICON_SAVE =
    '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  let todos = load();
  let editingId = null;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* storage unavailable */
    }
  }
  const newId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /** "Make Food 3" -> { text: "Make Food", times: 3 }.  "Read 5 books" -> times 1. */
  function parseInput(raw) {
    const value = raw.trim().replace(/\s+/g, " ");
    const match = value.match(/^(.*\S)\s+(\d+)$/);
    if (match) return { text: match[1], times: parseInt(match[2], 10) };
    return { text: value, times: 1 };
  }

  function showError(msg) {
    hint.textContent = msg;
    hint.classList.add("error");
  }
  function clearError() {
    hint.textContent = HINT_TEXT;
    hint.classList.remove("error");
  }

  function render() {
    list.textContent = "";
    for (const t of todos) {
      const li = document.createElement("li");
      li.className = "todo";
      li.dataset.id = t.id;

      const editing = t.id === editingId;
      let body;
      if (editing) {
        body = document.createElement("input");
        body.className = "edit-input";
        body.value = t.text;
        body.maxLength = 120;
        body.setAttribute("aria-label", "Edit todo");
      } else {
        body = document.createElement("span");
        body.className = "label";
        body.textContent = t.text + " ";
        const count = document.createElement("span");
        count.className = "count";
        count.textContent = `(Updated ${t.updates} ${t.updates === 1 ? "time" : "times"})`;
        body.append(count);
      }

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.innerHTML =
        `<button class="icon-btn" data-action="delete" aria-label="Delete todo" title="Delete">${ICON_DELETE}</button>` +
        `<button class="icon-btn" data-action="${editing ? "save" : "edit"}" aria-label="${editing ? "Save changes" : "Edit todo"}" title="${editing ? "Save" : "Edit"}">${editing ? ICON_SAVE : ICON_EDIT}</button>`;

      li.append(body, actions);
      list.append(li);
    }
    empty.hidden = todos.length > 0;

    if (editingId) {
      const field = list.querySelector(".edit-input");
      if (field) {
        field.focus();
        field.setSelectionRange(field.value.length, field.value.length);
      }
    }
  }

  function commitEdit(id, value) {
    const todo = todos.find((t) => t.id === id);
    const text = value.trim().replace(/\s+/g, " ");
    if (todo && text && text !== todo.text) {
      todo.text = text;
      todo.updates += 1; // the twist: count every real update
      save();
    }
    editingId = null;
    render();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { text, times } = parseInput(input.value);
    if (!text) {
      showError("Type a task first.");
      input.focus();
      return;
    }
    if (times < 1) {
      showError("Number must be 1 or more.");
      return;
    }
    if (times > MAX_REPEAT) {
      showError(`You can add up to ${MAX_REPEAT} at once.`);
      return;
    }

    for (let i = 0; i < times; i++)
      todos.push({ id: newId(), text, updates: 0 });
    save();
    clearError();
    input.value = "";
    input.focus();
    render();
  });
  input.addEventListener("input", clearError);

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.closest(".todo").dataset.id;
    const action = btn.dataset.action;

    if (action === "delete") {
      todos = todos.filter((t) => t.id !== id);
      if (editingId === id) editingId = null;
      save();
      render();
    } else if (action === "edit") {
      editingId = id;
      render();
    } else if (action === "save") {
      commitEdit(id, btn.closest(".todo").querySelector(".edit-input").value);
    }
  });

  list.addEventListener("keydown", (e) => {
    if (!e.target.classList.contains("edit-input")) return;
    const id = e.target.closest(".todo").dataset.id;
    if (e.key === "Enter") commitEdit(id, e.target.value);
    if (e.key === "Escape") {
      editingId = null;
      render();
    }
  });

  render();
})();

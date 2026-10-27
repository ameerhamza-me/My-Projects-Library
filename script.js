
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const modalOverlay = document.getElementById("modalOverlay");

const resourceForm = document.getElementById("resourceForm");
const resourceName = document.getElementById("resourceName");
const resourceUrl = document.getElementById("resourceUrl");
const resourceCategory = document.getElementById("resourceCategory");
const resourceDescription = document.getElementById("resourceDescription");

const resourceGrid = document.getElementById("resourceGrid");
const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateText = document.getElementById("emptyStateText");
const totalResources = document.getElementById("totalResources");
const totalFavorites = document.getElementById("totalFavorites");
const totalCategories = document.getElementById("totalCategories");
const categoryFilter = document.getElementById("categoryFilter");
const sectionTitle = document.getElementById("sectionTitle");
const searchInput = document.getElementById("searchInput");
const modalTitle = document.querySelector(".modal-header h2");
const submitButton = resourceForm.querySelector('button[type="submit"]');
const navItems = document.querySelectorAll(".nav-item");

let resources = [];
let editingResourceId = null;
let currentView = "all";

try {
  const savedResources = JSON.parse(localStorage.getItem("resources"));
  resources = Array.isArray(savedResources) ? savedResources : [];
} catch {
  resources = [];
}

resources = resources.map(function(resource) {
  return {
    ...resource,
    favorite: Boolean(resource.favorite)
  };
});

openModalBtn.addEventListener("click", function() {
  resourceForm.reset();
  resetEditor();
  modalOverlay.classList.add("show");
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", function(event) {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

navItems.forEach(function(navItem) {
  navItem.addEventListener("click", function() {
    currentView = navItem.dataset.view;

    navItems.forEach(function(item) {
      item.classList.toggle("active", item === navItem);
    });

    sectionTitle.textContent = currentView === "favorites" ? "Favorites" : "All Resources";
    displayResources();
  });
});

categoryFilter.addEventListener("change", displayResources);
searchInput.addEventListener("input", displayResources);

function closeModal() {
  modalOverlay.classList.remove("show");
  resourceForm.reset();
  resetEditor();
}

function resetEditor() {
  editingResourceId = null;
  modalTitle.textContent = "Add New Resource";
  submitButton.innerHTML = '<i class="fa-solid fa-plus"></i> Save Resource';
}

function saveResources() {
  localStorage.setItem("resources", JSON.stringify(resources));
}

resourceForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = resourceName.value.trim();
  let url = resourceUrl.value.trim();
  const category = resourceCategory.value.trim();
  const description = resourceDescription.value.trim();

  if (!name || !url || !category) {
    alert("Please fill all required fields.");
    return;
  }

  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    url = "https://" + url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      !["https:", "http:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname.includes(".")
    ) {
      throw new Error("Invalid URL");
    }

    url = parsedUrl.href;
  } catch {
    alert("Please enter a valid website URL.");
    return;
  }

  if (editingResourceId !== null) {
    const resourceIndex = resources.findIndex(function(resource) {
      return resource.id === editingResourceId;
    });

    if (resourceIndex === -1) {
      alert("Resource not found.");
      return;
    }

    resources[resourceIndex] = {
      ...resources[resourceIndex],
      name: name,
      url: url,
      category: category,
      description: description
    };
  } else {
    const newResource = {
      id: Date.now(),
      name: name,
      url: url,
      category: category,
      description: description,
      favorite: false
    };

    resources.push(newResource);
  }

  saveResources();
  displayResources();
  closeModal();
});

function displayResources() {
  resourceGrid.innerHTML = "";

  const selectedCategory = categoryFilter.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleResources = resources.filter(function(resource) {
    const matchesView = currentView !== "favorites" || resource.favorite;

    const matchesCategory =
      selectedCategory === "all" ||
      String(resource.category || "").toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      String(resource.name || "").toLowerCase().includes(searchTerm) ||
      String(resource.description || "").toLowerCase().includes(searchTerm) ||
      String(resource.category || "").toLowerCase().includes(searchTerm) ||
      String(resource.url || "").toLowerCase().includes(searchTerm);

    return matchesView && matchesCategory && matchesSearch;
  });

  visibleResources.forEach(function(resource) {
    const card = document.createElement("div");
    card.classList.add("resource-card");

    const top = document.createElement("div");
    top.className = "resource-card-top";

    const resourceIcon = document.createElement("div");
    resourceIcon.className = "resource-icon";
    resourceIcon.innerHTML = '<i class="fa-solid fa-link"></i>';

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const favoriteBtn = document.createElement("button");
    favoriteBtn.type = "button";
    favoriteBtn.className = "icon-btn favorite-btn";
    favoriteBtn.classList.toggle("is-favorite", resource.favorite);
    favoriteBtn.title = resource.favorite ? "Remove from Favorites" : "Add to Favorites";
    favoriteBtn.setAttribute(
      "aria-label",
      resource.favorite ? "Remove " + resource.name + " from favorites" : "Add " + resource.name + " to favorites"
    );
    favoriteBtn.setAttribute("aria-pressed", String(resource.favorite));
    favoriteBtn.innerHTML = resource.favorite
      ? '<i class="fa-solid fa-star"></i>'
      : '<i class="fa-regular fa-star"></i>';

    favoriteBtn.addEventListener("click", function() {
      toggleFavorite(resource.id);
    });

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn edit-btn";
    editBtn.title = "Edit Resource";
    editBtn.setAttribute("aria-label", "Edit " + resource.name);
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';

    editBtn.addEventListener("click", function() {
      editResource(resource.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.title = "Delete Resource";
    deleteBtn.setAttribute("aria-label", "Delete " + resource.name);
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

    deleteBtn.addEventListener("click", function() {
      deleteResource(resource.id);
    });

    actions.appendChild(favoriteBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    top.appendChild(resourceIcon);
    top.appendChild(actions);

    const title = document.createElement("h3");
    title.textContent = resource.name;

    const description = document.createElement("p");
    description.className = "resource-description";
    description.textContent = resource.description;

    const category = document.createElement("span");
    category.className = "category-tag";
    category.textContent = resource.category || "Other";

    const bottomActions = document.createElement("div");
    bottomActions.className = "resource-bottom-actions";

    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = resource.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML =
      'Visit Website <i class="fa-solid fa-arrow-up-right-from-square"></i>';

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-link-btn";
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Link';

    copyBtn.addEventListener("click", function() {
      copyResourceLink(resource.url, copyBtn);
    });

    bottomActions.appendChild(link);
    bottomActions.appendChild(copyBtn);

    card.appendChild(top);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(category);
    card.appendChild(bottomActions);

    resourceGrid.appendChild(card);
  });

  emptyState.style.display = visibleResources.length === 0 ? "block" : "none";

  if (visibleResources.length === 0) {
    if (currentView === "favorites") {
      emptyStateTitle.textContent = "No favorites yet";
      emptyStateText.textContent = "Click the star on any resource to add it to your favorites.";
    } else {
      emptyStateTitle.textContent = "No resources found";
      emptyStateText.textContent = "Your resources will appear here. Start by adding your first resource.";
    }
  }

  totalResources.textContent = resources.length;

  totalFavorites.textContent = resources.filter(function(resource) {
    return resource.favorite;
  }).length;

  totalCategories.textContent = new Set(
    resources.map(function(resource) {
      return String(resource.category || "").trim().toLowerCase();
    }).filter(Boolean)
  ).size;
}

function toggleFavorite(id) {
  const resource = resources.find(function(item) {
    return item.id === id;
  });

  if (!resource) {
    alert("Resource not found.");
    return;
  }

  resource.favorite = !resource.favorite;

  saveResources();
  displayResources();
}

async function copyResourceLink(url, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = url;
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();

      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        throw new Error("Copy failed");
      }
    }

    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    button.classList.add("copied");

    setTimeout(function() {
      button.innerHTML = originalContent;
      button.classList.remove("copied");
    }, 1800);
  } catch {
    alert("Could not copy the link automatically. Please copy this URL manually:\n" + url);
  }
}

function editResource(id) {
  const resource = resources.find(function(item) {
    return item.id === id;
  });

  if (!resource) {
    alert("Resource not found.");
    return;
  }

  editingResourceId = id;

  const categoryExists = Array.from(resourceCategory.options).some(function(option) {
    return option.value === resource.category;
  });

  if (!categoryExists) {
    const option = document.createElement("option");
    option.value = resource.category;
    option.textContent = resource.category;
    resourceCategory.appendChild(option);
  }

  resourceName.value = resource.name;
  resourceUrl.value = resource.url;
  resourceCategory.value = resource.category;
  resourceDescription.value = resource.description;

  modalTitle.textContent = "Edit Resource";
  submitButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Resource';

  modalOverlay.classList.add("show");
}

function deleteResource(id) {
  const resource = resources.find(function(item) {
    return item.id === id;
  });

  if (!resource) {
    alert("Resource not found.");
    return;
  }

  const confirmed = confirm(
    'Are you sure you want to delete "' + resource.name + '"?'
  );

  if (!confirmed) {
    return;
  }

  resources = resources.filter(function(item) {
    return item.id !== id;
  });

  saveResources();
  displayResources();

  if (editingResourceId === id) {
    closeModal();
  }
}

displayResources();



Object.entries(localStorage).map(([key, value]) => {
  let data;
  try {
    data = JSON.parse(value);
  } catch {
    data = null;
  }

  return {
    key,
    size: value.length,
    type: Array.isArray(data) ? "array" : typeof data,
    count: Array.isArray(data)
      ? data.length
      : data && typeof data === "object"
        ? Object.keys(data).length
        : "-"
  };
});
const GITHUB_REPO = "ohbm/ossig";
// Each edition's GitHub label is set on its panel in src/source-projects.njk (data-label="...").

function parseIssueField(body, fieldName) {
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`###\\s*${escapedFieldName}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`, "i");
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function showState(panel, { loading = false, error = "", empty = false, hasProjects = false }) {
  const loadingEl = panel.querySelector(".projects-loading");
  const errorEl = panel.querySelector(".projects-error");
  const emptyEl = panel.querySelector(".projects-empty");
  const listEl = panel.querySelector(".projects-list");

  if (!loadingEl || !errorEl || !emptyEl || !listEl) {
    return;
  }

  loadingEl.classList.toggle("hidden", !loading);
  errorEl.classList.toggle("hidden", !error);
  emptyEl.classList.toggle("hidden", !empty);
  listEl.classList.toggle("hidden", !hasProjects);

  if (error) {
    errorEl.textContent = error;
  }
}

function createProjectItem(title, url) {
  const link = document.createElement("a");
  link.className = "project-button";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = title;
  return link;
}

async function fetchSourceProjects(panel) {
  const label = panel.dataset.label;
  const endpoint = `https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`;

  showState(panel, { loading: true });

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("GitHub API rate limit reached. Please try again later.");
      }
      if (response.status === 404) {
        throw new Error("GitHub repository not found. Please verify the repository setting.");
      }
      throw new Error(`Unable to load source projects (HTTP ${response.status}).`);
    }

    const issues = await response.json();

    const matchingProjects = issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => {
        const body = issue.body || "";
        const submittingAs = parseIssueField(body, "I am submitting as:");
        const sourceTitle = parseIssueField(body, "Title of Your Source Work / Project");

        return {
          title: sourceTitle,
          isSourceParty: submittingAs ? submittingAs.toLowerCase().includes("source party") : false,
          htmlUrl: issue.html_url
        };
      })
      .filter((entry) => entry.isSourceParty && entry.title);

    const listEl = panel.querySelector(".projects-list");

    if (!matchingProjects.length) {
      showState(panel, { empty: true });
      return;
    }

    if (!listEl) {
      return;
    }

    listEl.innerHTML = "";
    matchingProjects.forEach((project) => {
      listEl.appendChild(createProjectItem(project.title, project.htmlUrl));
    });

    showState(panel, { hasProjects: true });
  } catch (error) {
    showState(panel, { error: error.message || "An unexpected error occurred while loading projects." });
  }
}

document.querySelectorAll(".projects-panel[data-label]").forEach((panel) => {
  fetchSourceProjects(panel);
});

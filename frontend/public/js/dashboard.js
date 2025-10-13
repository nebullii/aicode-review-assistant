// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// If token exists, store it and clean URL
if (token) {
  localStorage.setItem('auth_token', token);
  window.history.replaceState({}, document.title, '/dashboard');
}

// Check if user is authenticated
const authToken = localStorage.getItem('auth_token');

if (!authToken) {
  window.location.href = '/';
} else {
  fetchUserData();
  fetchRepositories();
}

async function fetchUserData() {
  try {
    const response = await fetch('http://localhost:3000/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json();
    const user = data.user;

    document.getElementById('user-name').textContent = user.github_username;
    document.getElementById('user-avatar').src = user.avatar_url;
    document.getElementById('user-avatar').classList.remove('hidden');

  } catch (error) {
    console.error('Auth error:', error);
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  }
}

async function fetchRepositories() {
  const loadingEl = document.getElementById('repos-loading');
  const listEl = document.getElementById('repos-list');
  const emptyEl = document.getElementById('repos-empty');

  try {
    const response = await fetch('http://localhost:3000/api/repositories', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const data = await response.json();
    
    loadingEl.classList.add('hidden');

    if (data.repositories.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    listEl.classList.remove('hidden');
    displayRepositories(data.repositories);

  } catch (error) {
    console.error('Error fetching repositories:', error);
    loadingEl.innerHTML = '<p class="text-red-400">Failed to load repositories</p>';
  }
}

function displayRepositories(repositories) {
  const listEl = document.getElementById('repos-list');

  listEl.innerHTML = repositories.map(repo => {
    const isConnected = repo.is_connected;
    const buttonClass = isConnected
      ? 'bg-green-600 cursor-not-allowed'
      : 'connect-repo-btn bg-blue-600 hover:bg-blue-700';
    const buttonText = isConnected ? '✓ Connected' : 'Connect';
    const buttonDisabled = isConnected ? 'disabled' : '';

    return `
      <div class="bg-gray-700 p-6 rounded-lg flex justify-between items-center">
        <div>
          <h4 class="text-xl font-semibold mb-2">${repo.name}</h4>
          <p class="text-gray-400 text-sm mb-2">${repo.description || 'No description'}</p>
          <div class="flex gap-4 text-sm text-gray-500">
            <span>${repo.stargazers_count}</span>
            <span>${repo.language}</span>
            <span>${repo.private ? 'Private' : 'Public'}</span>
          </div>
        </div>
        <button
          class="${buttonClass} px-6 py-2 rounded font-semibold"
          data-repo-id="${repo.github_id}"
          data-repo-name="${repo.full_name}"
          ${buttonDisabled}>
          ${buttonText}
        </button>
      </div>
    `;
  }).join('');
}

// Refresh button
document.getElementById('refresh-repos-btn').addEventListener('click', () => {
  document.getElementById('repos-loading').classList.remove('hidden');
  document.getElementById('repos-list').classList.add('hidden');
  document.getElementById('repos-empty').classList.add('hidden');
  fetchRepositories();
});

// Connect repository button handler
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('connect-repo-btn')) {
    const button = e.target;
    const repoId = button.dataset.repoId;
    const repoName = button.dataset.repoName;
    
    // Get full repo data from the displayed list
    const repoCard = button.closest('.bg-gray-700');
    const repoTitle = repoCard.querySelector('h4').textContent;
    const repoDesc = repoCard.querySelector('p').textContent;

    button.disabled = true;
    button.textContent = 'Connecting...';

    try {
      const response = await fetch('http://localhost:3000/api/repositories/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          github_id: parseInt(repoId),
          name: repoTitle,
          full_name: repoName,
          description: repoDesc === 'No description' ? null : repoDesc,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        button.textContent = '✓ Connected';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'connect-repo-btn');
        button.classList.add('bg-green-600', 'cursor-not-allowed');
        button.disabled = true;
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Error connecting repository:', error);
      button.textContent = 'Connect';
      button.disabled = false;
      alert('Failed to connect repository: ' + error.message);
    }
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  window.location.href = '/';
});
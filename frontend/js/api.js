const API = '';

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

async function apiCall(path, options = {}) {
    let res;
    try {
        res = await fetch(API + path, options);
    } catch {
        throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré (npm start).');
    }

    if (res.status === 401 && getToken()) {
        clearToken();
        window.location.href = 'login.html';
        return;
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
        throw new Error(`Erreur serveur inattendue (${res.status}). Vérifiez les logs du backend.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Une erreur est survenue');
    return data;
}

async function login(email, password) {
    const data = await apiCall('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return data.token;
}

async function register(email, password, name, firstname) {
    const data = await apiCall('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, firstname })
    });
    return data.token;
}

async function getUser() {
    return apiCall('/user', { headers: authHeaders() });
}

async function updateUser(id, email, name, firstname, password) {
    const body = { email, name, firstname };
    if (password) body.password = password;
    return apiCall(`/users/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
}

async function getBoards() {
    return apiCall('/boards', { headers: authHeaders() });
}

async function getBoard(id) {
    return apiCall(`/boards/${id}`, { headers: authHeaders() });
}

async function createBoard(name) {
    return apiCall('/boards', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name })
    });
}

async function updateBoard(id, name) {
    return apiCall(`/boards/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name })
    });
}

async function deleteBoard(id) {
    return apiCall(`/boards/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
}

async function getTodos(board_id) {
    return apiCall(`/todos?board_id=${board_id}`, { headers: authHeaders() });
}

async function createTodo(title, description, due_time, list_id) {
    return apiCall('/todos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, due_time, list_id })
    });
}

async function updateTodo(id, title, description, status, due_time) {
    return apiCall(`/todos/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, status, due_time })
    });
}

async function deleteTodo(id) {
    return apiCall(`/todos/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
}

async function getLists(boardId) {
    return apiCall(`/lists?board_id=${boardId}`, { headers: authHeaders() });
}

async function createList(title, boardId, parentListId = null) {
    return apiCall('/lists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, board_id: boardId, parent_list_id: parentListId })
    });
}

async function updateList(id, title) {
    return apiCall(`/lists/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title })
    });
}

async function deleteList(id) {
    return apiCall(`/lists/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
}

async function moveList(id, position) {
    return apiCall(`/lists/${id}/move`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ position })
    });
}

async function moveTodo(id, listId, position) {
    return apiCall(`/todos/${id}/move`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ list_id: listId, position })
    });
}

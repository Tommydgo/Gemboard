function setToken(token) {
    localStorage.setItem('gemboard_token', token);
}

function getToken() {
    return localStorage.getItem('gemboard_token');
}

function clearToken() {
    localStorage.removeItem('gemboard_token');
}

function getUserId() {
    const token = getToken();
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1])).id;
    } catch {
        return null;
    }
}

function requireAuth() {
    if (!getToken()) window.location.href = 'login.html';
}

function logout() {
    clearToken();
    window.location.href = 'login.html';
}

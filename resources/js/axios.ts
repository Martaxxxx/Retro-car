import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:8000'; // ← bez /api, bo używasz tras z web.php
axios.defaults.withCredentials = true; // ← potrzebne dla ciasteczek sesyjnych

export default axios;

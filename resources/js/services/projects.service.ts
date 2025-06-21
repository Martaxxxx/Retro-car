import axios from 'axios';

const API_URL = '/api/projects'; // Zmień na odpowiedni endpoint, jeśli Twój backend używa innego!

const getProjects = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

const projectsService = {
    getProjects,
};

export default projectsService;
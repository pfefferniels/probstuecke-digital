import {create} from 'apisauce';
import {apiUrl} from './config';

const api = create({baseURL: apiUrl});

export default api;

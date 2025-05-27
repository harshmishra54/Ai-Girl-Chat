import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api/v1", // change if your backend port is different
  withCredentials: true, // optional, use if handling cookies
});

export default instance;

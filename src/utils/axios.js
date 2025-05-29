import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_BASEURL, // ✅ using your env variable
  withCredentials: true, // optional if not using cookies
});

export default instance;

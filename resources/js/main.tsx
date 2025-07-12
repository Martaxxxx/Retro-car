import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./components/context/UserContext";
import { ProjectProvider } from "./components/context/ProjectContext";
import { LoadingProvider } from "./components/context/LoadingContext";
import GlobalLoader from "./components/context/GlobalLoader";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import axios from "axios";

const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrf) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrf;
}
axios.defaults.headers.common['Accept'] = 'application/json';


createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <LoadingProvider>
            <UserProvider>
                <ProjectProvider>
                    <BrowserRouter>
                        <GlobalLoader>
                            <App />
                        </GlobalLoader>
                    </BrowserRouter>
                </ProjectProvider>
            </UserProvider>
        </LoadingProvider>
    </StrictMode>
);
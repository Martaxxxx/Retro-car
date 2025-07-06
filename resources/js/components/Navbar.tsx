import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Search, Settings, User, Menu, LogOut } from "lucide-react";
import { NavLink as RouterLink, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useUser } from "../components/context/UserContext";
import axios from "axios";

// ----- Styled Components definitions -----
const NavbarContainer = styled.div`
  width: 100%;
  height: 72px;
  background: #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const Logo = styled.img`
  width: 70px;
  height: 70px;
  object-fit: contain;
  margin-left: 10px;
`;

const NavLinks = styled.div<{ $isOpen: boolean }>`
  display: flex;
  gap: 60px;
  align-items: center;
  margin-left: -40px;

  @media (max-width: 1024px) {
    position: absolute;
    top: 72px;
    left: 0;
    width: 100%;
    flex-direction: column;
    background: #e6e6e6;
    padding: 20px 0;
    display: ${({ $isOpen }) => ($isOpen ? "flex" : "none")};
  }
`;

const StyledRouterLink = styled(RouterLink)`
  font-size: 16px;
  font-family: "Roboto", sans-serif;
  font-weight: 500;
  color: black;
  text-decoration: none;
  position: relative;
  padding-bottom: 4px;

  &.active::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #9c2f3b;
    border-radius: 2px;
  }

  &:hover {
    color: #9c2f3b;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #9c2f3b;
  border-radius: 999px;
  padding: 6px 12px;
  margin-right: 24px;
  width: 280px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const SearchField = styled.input`
  border: none;
  outline: none;
  margin-left: 8px;
  width: 100%;
  font-size: 14px;
  background: transparent;
  color: white;

  &::placeholder {
    color: #f8dede;
  }
`;

const IconsContainer = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
  margin-right: -80px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const IconWrapper = styled.div`
  cursor: pointer;

  &:hover {
    color: #9c2f3b;
  }
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: 20px;
  background: #9c2f3b;
  color: white;
  font-size: 14px;
  font-family: "Roboto", sans-serif;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 10px;

  &:hover {
    background-color: #821f2e;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: scale(0.96);
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Hamburger = styled.div`
  display: none;
  cursor: pointer;

  @media (max-width: 1024px) {
    display: block;
    margin-left: 16px;
  }
`;

const UserGreeting = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #9c2f3b;
  color: white;
  font-size: 14px;
  font-family: "Roboto", sans-serif;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 999px;
  margin-right: 10px;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 60px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  min-width: 160px;
  z-index: 100;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 1024px) {
    margin-left: auto;
  }
`;

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRenowacjeSuggestion, setShowRenowacjeSuggestion] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setShowRenowacjeSuggestion(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 1) {
        setSearchResults([]);
        setShowRenowacjeSuggestion(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`/projects/search`, {
          params: { query: searchQuery },
        });
        const results = Array.isArray(response.data) ? response.data : [];
        setSearchResults(results);
        setShowRenowacjeSuggestion(results.length === 0);
      } catch {
        setSearchResults([]);
        setShowRenowacjeSuggestion(true);
      } finally {
        setIsLoading(false);
      }
    };
    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleResultClick = (project: any) => {
    navigate(`/projectdetails/${project.id}/${encodeURIComponent(project.name)}`);
    setSearchResults([]);
    setSearchQuery("");
    setShowRenowacjeSuggestion(false);
  };

  const handleRenowacjeClick = () => {
    window.location.href = "http://localhost:8000/renowacje";
    setSearchResults([]);
    setSearchQuery("");
    setShowRenowacjeSuggestion(false);
  };

  return (
    <NavbarContainer>
      <Logo src="/retro2.png" alt="Logo" />

      <NavLinks $isOpen={isOpen}>
        <StyledRouterLink to="/" end>Strona główna</StyledRouterLink>
        <StyledRouterLink to="/renowacje">Renowacje</StyledRouterLink>
        <StyledRouterLink to="/raporty">Raporty</StyledRouterLink>
        {(user?.roles?.includes("manager") || user?.roles?.includes("admin")) && (
          <StyledRouterLink to="/zarządzanie">Zarządzanie</StyledRouterLink>
        )}
        {user?.roles?.includes("admin") && (
          <StyledRouterLink to="/adminpanel">Admin</StyledRouterLink>
        )}
      </NavLinks>

      <form onSubmit={(e) => e.preventDefault()} style={{ position: "relative" }}>
        <SearchInputWrapper>
          <Search size={18} color="white" />
          <SearchField
            placeholder="Szukaj projektów..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </SearchInputWrapper>

        {(isLoading || searchResults.length > 0 || showRenowacjeSuggestion) && (
          <div
            ref={searchResultsRef}
            style={{
              position: "absolute",
              top: "50px",
              left: 0,
              background: "white",
              width: "280px",
              zIndex: 100,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
              paddingTop: 7,
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {isLoading ? (
              <div style={{ padding: "12px", color: "#9c2f3b" }}>Ładowanie...</div>
            ) : searchResults.length === 0 && showRenowacjeSuggestion ? (
              <div style={{ padding: "12px", color: "#999" }}>
                Brak wyników.
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={handleRenowacjeClick}
                    style={{
                      background: "#9c2f3b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "6px 18px",
                      fontSize: "14px",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                  >
                    Przejdź do strony <b>Renowacje</b>
                  </button>
                </div>
              </div>
            ) : (
              searchResults.map((project, index) => (
                <div
                  key={index}
                  onClick={() => handleResultClick(project)}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <strong>{project.name}</strong><br />
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {project.brand} {project.model} • {project.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </form>

      <IconsContainer>
        <IconWrapper>
          {user && user.id && (
            <NotificationBell userId={user.id} />
          )}
        </IconWrapper>
        <IconWrapper onClick={() => navigate("/ustawienia")}>
          <Settings size={26} />
        </IconWrapper>
      </IconsContainer>

      <RightSection>
        {user ? (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <UserGreeting onClick={() => setShowDropdown(!showDropdown)}>
              <img src={user.avatar || "/user.jpg"} alt="avatar" />
              Witaj, {user.name}
            </UserGreeting>
            {showDropdown && (
              <DropdownMenu>
                <DropdownItem onClick={logout}>
                  <LogOut size={18} /> Wyloguj
                </DropdownItem>
              </DropdownMenu>
            )}
          </div>
        ) : (
          <LoginButton onClick={() => navigate("/login")}>
            <User size={18} /> Zaloguj się
          </LoginButton>
        )}
        <Hamburger onClick={() => setIsOpen(!isOpen)}>
          <Menu size={24} />
        </Hamburger>
      </RightSection>
    </NavbarContainer>
  );
};

export default Navbar;
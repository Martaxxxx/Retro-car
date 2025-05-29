import React from "react";
import styled, { keyframes } from "styled-components";
import { useLoading } from "../context/LoadingContext";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const ContentWrapper = styled.div<{ dimmed: boolean }>`
  transition: opacity 0.3s ease;
  opacity: ${({ dimmed }) => (dimmed ? 0.4 : 1)};
  pointer-events: ${({ dimmed }) => (dimmed ? "none" : "auto")};
`;

const SpinnerWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
`;

const Spinner = styled.div`
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-top: 6px solid #9C2F3B;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1s linear infinite;
`;

interface LoaderProps {
    children: React.ReactNode;
}

const GlobalLoader: React.FC<LoaderProps> = ({ children }) => {
    const { isLoading } = useLoading();

    return (
        <>
            <ContentWrapper dimmed={isLoading}>
                {children}
            </ContentWrapper>
            {isLoading && (
                <SpinnerWrapper>
                    <Spinner />
                </SpinnerWrapper>
            )}
        </>
    );
};

export default GlobalLoader;

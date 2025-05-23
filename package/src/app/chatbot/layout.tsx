"use client";
import { styled, Container, Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import Sidebar from "@/app/(DashboardLayout)/layout/sidebar/Sidebar";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  overflow: "hidden"
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  width: "100%",
  height: "100vh",
  overflowY: "auto"
}));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MainWrapper className="mainwrapper">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      
      <PageWrapper className="page-wrapper">        
        <Container
          sx={{
            paddingTop: "20px",
            maxWidth: "1200px",
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Box sx={{ flex: 1 }}>{children}</Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
}
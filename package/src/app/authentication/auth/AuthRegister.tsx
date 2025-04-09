import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import Link  from 'next/link';

import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import { Stack } from '@mui/system';

interface registerType {
    title?: string;
    subtitle?: JSX.Element | JSX.Element[];
    subtext?: JSX.Element | JSX.Element[];
    onSubmit: (formData: {
        email: string;
        password: string;
        name: string;
      }) => Promise<void>;
    loading: boolean;
  }

  const AuthRegister = ({ title, subtitle, subtext, onSubmit, loading }: registerType) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
    });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit(formData);
    };
  
    return (
      <>
        {title ? (
          <Typography fontWeight="700" variant="h2" mb={1}>
            {title}
          </Typography>
        ) : null}
  
        {subtext}
  
        <Box component="form" onSubmit={handleSubmit}>
          <Stack mb={3}>
            <Typography 
              variant="subtitle1"
              fontWeight={600} 
              component="label" 
              htmlFor='name' 
              mb="5px"
            >
              Name
            </Typography>
            <CustomTextField 
              id="name" 
              variant="outlined" 
              fullWidth 
              value={formData.name}
              onChange={handleChange}
              required
            />
  
            <Typography 
              variant="subtitle1"
              fontWeight={600} 
              component="label" 
              htmlFor='email' 
              mb="5px" 
              mt="25px"
            >
              Email Address
            </Typography>
            <CustomTextField 
              id="email" 
              type="email"
              variant="outlined" 
              fullWidth 
              value={formData.email}
              onChange={handleChange}
              required
            />
  
            <Typography 
              variant="subtitle1"
              fontWeight={600} 
              component="label" 
              htmlFor='password' 
              mb="5px" 
              mt="25px"
            >
              Password
            </Typography>
            <CustomTextField 
              id="password" 
              type="password" 
              variant="outlined" 
              fullWidth 
              value={formData.password}
              onChange={handleChange}
              required
              inputProps={{ minLength: 6 }}
            />
          </Stack>
  
          <Button 
            color="primary" 
            variant="contained" 
            size="large" 
            fullWidth 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign Up'
            )}
          </Button>
        </Box>
        {subtitle}
      </>
    );
  };
  
export default AuthRegister;

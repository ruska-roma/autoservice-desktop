import { Box, Grid } from '@chakra-ui/react';
import { Outlet } from 'react-router';

import { Navigation } from '@/shared/ui/navigation';

export function Layout() {
  return (
    <Grid templateColumns="280px 1fr" templateRows="1fr" minH="100vh" maxH="100vh">
      <Box as="aside" h="100vh" p={5} overflow="hidden">
        <Navigation />
      </Box>
      <Box as="main" h="100vh">
        <Outlet />
      </Box>
    </Grid>
  );
}

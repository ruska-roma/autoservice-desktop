import { createToaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
  duration: Infinity,
  max: 2,
});

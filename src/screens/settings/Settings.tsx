import { lazy, Suspense } from 'react';

import { Container, Preloader } from '@/shared/ui';

const EditCompany = lazy(() =>
  import('@/features').then((module) => ({ default: module.EditCompany })),
);
const EditSettings = lazy(() =>
  import('@/features').then((module) => ({ default: module.EditSettings })),
);
const EditSecurity = lazy(() =>
  import('@/features').then((module) => ({ default: module.EditSecurity })),
);
const MasterList = lazy(() =>
  import('@/features').then((module) => ({ default: module.MasterList })),
);

export function Settings() {
  return (
    <Container>
      <Suspense fallback={<Preloader />}>
        <EditCompany containerProps={{ mb: 5 }} />
        <EditSettings containerProps={{ mb: 5 }} />
        <MasterList containerProps={{ mb: 5 }} />
        <EditSecurity />
      </Suspense>
    </Container>
  );
}

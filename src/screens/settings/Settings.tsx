import { lazy, Suspense } from 'react';

import { Container, Preloader } from '@/shared/ui';

const CompanyWidget = lazy(() =>
  import('./widgets/CompanyWidget').then((module) => ({ default: module.CompanyWidget })),
);
const SettingsWidget = lazy(() =>
  import('./widgets/SettingsWidget').then((module) => ({ default: module.SettingsWidget })),
);
const SecurityWidget = lazy(() =>
  import('./widgets/SecurityWidget').then((module) => ({ default: module.SecurityWidget })),
);
const MasterList = lazy(() =>
  import('@/features').then((module) => ({ default: module.MasterList })),
);

export function Settings() {
  return (
    <Container>
      <Suspense fallback={<Preloader />}>
        <CompanyWidget containerProps={{ mb: 5 }} />
        <SettingsWidget containerProps={{ mb: 5 }} />
        <MasterList containerProps={{ mb: 5 }} />
        <SecurityWidget />
      </Suspense>
    </Container>
  );
}

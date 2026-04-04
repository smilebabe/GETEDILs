import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppShell from './AppShell';

// 🧩 Lazy-loaded pillars
const GetHired = lazy(() => import('@/pillars/get-hired'));
const RealEstate = lazy(() => import('@/pillars/real-estate'));
const Logistics = lazy(() => import('@/pillars/logistics'));

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen text-white">
      Initializing Module...
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <AppShell />
      
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/get-hired" element={<GetHired />} />
          <Route path="/real-estate" element={<RealEstate />} />
          <Route path="/logistics" element={<Logistics />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

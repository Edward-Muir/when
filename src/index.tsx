import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import HomeRoute from './pages/Home';
import DailyRoute from './routes/DailyRoute';
import ChallengeRoute from './routes/ChallengeRoute';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Support from './pages/Support';
import CardsPreview from './pages/CardsPreview';
import Timeline from './pages/Timeline';
import UnlockPreview from './pages/UnlockPreview';
import ImageQc from './pages/ImageQc';
import CardReports from './pages/CardReports';
import AnimJig from './pages/AnimJig';
import ReminderPreview from './pages/ReminderPreview';
import SharePreview from './pages/SharePreview';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The home pager; the segment names the tab it opens on (see pages/Home.tsx). */}
        <Route path="/:tab?" element={<HomeRoute />} />
        <Route path="/daily" element={<DailyRoute />} />
        <Route path="/challenge/:code" element={<ChallengeRoute />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<Support />} />
        <Route path="/cards-preview" element={<CardsPreview />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/unlock-preview" element={<UnlockPreview />} />
        <Route path="/image-qc" element={<ImageQc />} />
        <Route path="/card-reports" element={<CardReports />} />
        <Route path="/anim-jig" element={<AnimJig />} />
        <Route path="/reminder-preview" element={<ReminderPreview />} />
        <Route path="/share-preview" element={<SharePreview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register the service worker only in production builds. In development, actively
// unregister so a previously-installed SW (e.g. from an earlier `npm run build` run on
// localhost) can't serve stale cached assets on refresh and hide live source edits.
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}

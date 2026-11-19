import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Header } from './components/Header'
import { NotFound } from './components/NotFound'
import { RequireStudent } from './components/RequireStudent'
import { LanguageProvider } from './i18n/LanguageProvider'
import { CreateListingPage } from './pages/CreateListingPage'
import { GuidelinesPage } from './pages/GuidelinesPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { ListingsPage } from './pages/ListingsPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { MyOffersPage } from './pages/MyOffersPage'
import { VerifyPage } from './pages/VerifyPage'

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<ListingsPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route
              path="/listings/new"
              element={
                <RequireStudent>
                  <CreateListingPage />
                </RequireStudent>
              }
            />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route
              path="/my-listings"
              element={
                <RequireStudent>
                  <MyListingsPage />
                </RequireStudent>
              }
            />
            <Route
              path="/offers"
              element={
                <RequireStudent>
                  <MyOffersPage />
                </RequireStudent>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App

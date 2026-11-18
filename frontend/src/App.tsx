import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Header } from './components/Header'
import { RequireStudent } from './components/RequireStudent'
import { CreateListingPage } from './pages/CreateListingPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { ListingsPage } from './pages/ListingsPage'
import { VerifyPage } from './pages/VerifyPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route
            path="/listings/new"
            element={
              <RequireStudent>
                <CreateListingPage />
              </RequireStudent>
            }
          />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="*" element={<p className="page-message">Page not found.</p>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css'
import App from './pages/App'
import Error404 from './pages/Error404'

import Home from './pages/Home'
import Games from './pages/Games'
import Party from './pages/Party'
import Reservation from './pages/Reservation';
import PartyKids from './pages/PartyKids'
import PartyMid from './pages/PartyMid'
import PartyFirm from './pages/PartyFirm'
import PartyAdult from './pages/PartyAdult'
import Price from './pages/Price'
import Gallery from './pages/Gallery'
import Discount from './pages/Discount'
import Contact from './pages/Contact'
import New from './pages/New'
import Polityka from './pages/Polityka'
import Regulamin from './pages/Regulamin'

import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminClientManager from './pages/AdminClientManager';
import AdminVoucher from './pages/AdminVoucher';
import AdminReservations from './pages/AdminReservations';



const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { 
        path: '/', 
        element: <Home />
      },

      { 
        path: '/gry-vr', 
        element: <Games />
      },

      { 
        path: '/imprezy', 
        element: <Party />
      },

      { 
        path: '/imprezy-dla-dzieci', 
        element: <PartyKids />
      },

      { 
        path: '/imprezy-dla-mlodziezy', 
        element: <PartyMid />
      },

      { 
        path: '/imprezy-dla-doroslych', 
        element: <PartyAdult />
      },

      { 
        path: '/imprezy-dla-firm', 
        element: <PartyFirm />
      },

      { 
        path: '/cennik', 
        element: <Price />
      },

      { 
        path: '/galeria', 
        element: <Gallery />
      },

      { 
        path: '/promocje', 
        element: <Discount />
      },

      { 
        path: '/aktualnosci', 
        element: <New />
      },

      { 
        path: '/kontakt', 
        element: <Contact />
      },

      { 
        path: '/rezerwacja', 
        element: <Reservation />
      },

      { 
        path: '/regulamin', 
        element: <Regulamin />
      },

      { 
        path: '/polityka-prywatnosci', 
        element: <Polityka />
      },

      {
        path: '/login',
        element: <AdminLogin />,
      },

      {
        path: '/admin',
        element: <AdminPanel />,
      },

      {
        path: '/admin/zarzadzanie',
        element: <AdminClientManager />,
      },

      {
        path: '/admin/vouchery',
        element: <AdminVoucher />,
      },

      {
        path: '/admin/rezerwacje',
        element: <AdminReservations />,
      },
    ],
    errorElement: <Error404 />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

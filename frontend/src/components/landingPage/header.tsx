import { Button } from "../ui/button"
import { NavLink } from "../ui/nav-link"
import { Icons } from "../ui/icons"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

     const navItems = [
        { href: "#home", label: "Home" },
        { href: "#mission", label: "Mission" },
        { href: "#features", label: "Features" },
        { href: "#impact", label: "Impact" },
      ]

      const handleNavClick = (href: string) => {
        if (location.pathname !== '/') {
          // If not on home page, navigate to home first
          navigate('/')
          // Wait for navigation to complete, then scroll
          setTimeout(() => {
            const element = document.querySelector(href)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' })
            }
          }, 100)
        } else {
          // If already on home page, just scroll
          const element = document.querySelector(href)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }
        setMobileMenuOpen(false)
      }


      const isSortingPage = location.pathname === '/sorting'

      return (
        <header className={`sticky top-0 z-50 w-full border-b ${isSortingPage ? 'border-gray-800 bg-black' : 'border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Icons.leaf className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className={`text-xl font-bold ${isSortingPage ? 'text-white' : 'text-foreground'}`}>ReBin</span>
              </div>
  {/* Desktop Navigation */}
  <nav className ="hidden md:flex items-center gap-6">
  {navItems.map((item) => (
              <button 
                key={item.href} 
                onClick={() => handleNavClick(item.href)}
                className={`text-sm font-medium hover:text-primary transition-colors ${isSortingPage ? 'text-white' : 'text-foreground'}`}
              >
                {item.label}
              </button>
            ))}
             <Button 
               className="bg-primary text-primary-foreground hover:bg-primary/90"
               onClick={() => navigate('/sorting')}
             >
               Get Started
             </Button>
             </nav>
             {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${isSortingPage ? 'text-white' : 'text-foreground'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <Icons.x className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className={`md:hidden py-4 space-y-4 border-t ${isSortingPage ? 'border-gray-800' : 'border-border/40'}`}>
            {navItems.map((item) => (
              <button 
                key={item.href} 
                onClick={() => handleNavClick(item.href)}
                className={`block w-full text-left text-sm font-medium hover:text-primary transition-colors py-2 ${isSortingPage ? 'text-white' : 'text-foreground'}`}
              >
                {item.label}
              </button>
            ))}
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                navigate('/sorting')
                setMobileMenuOpen(false)
              }}
            >
              Get Started
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}

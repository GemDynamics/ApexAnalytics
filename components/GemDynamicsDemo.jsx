import React from 'react';
import GemDynamicsLogo from './GemDynamicsLogo';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const GemDynamicsDemo = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: 'var(--background)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column',
      color: 'var(--foreground)',
      fontFamily: 'Inter, Arial, sans-serif',
    }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-16">
          <div style={{ width: '500px', height: '250px' }}>
            <GemDynamicsLogo />
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">GEM DYNAMICS Design System</h1>
            <p className="mt-2 text-muted-foreground">Modern, futuristisch, technik-orientiert</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Standard</Button>
              <Button variant="secondary">Sekundär</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="gradient">Gradient</Button>
              <Button variant="primary" glow={true}>Mit Glow</Button>
              <Button variant="primary" rounded="full">Abgerundet</Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Cards</h2>
            <div className="flex gap-4 flex-col">
              <Card hover={true}>
                <CardHeader>
                  <CardTitle>Hover Card</CardTitle>
                  <CardDescription>Mit Hover-Effekt</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Diese Karte hat einen dezenten Hover-Effekt.</p>
                </CardContent>
              </Card>
              
              <Card gradient={true} glow={true}>
                <CardHeader>
                  <CardTitle>Gradient Card</CardTitle>
                  <CardDescription>Mit Gradient und Glow</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Diese Karte hat einen subtilen Farbverlauf und Glow-Effekt.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Farbpalette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary"></div>
              <span className="mt-2 text-sm">Primär</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary"></div>
              <span className="mt-2 text-sm">Sekundär</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent"></div>
              <span className="mt-2 text-sm">Akzent</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gem-gradient"></div>
              <span className="mt-2 text-sm">Gradient</span>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GEM DYNAMICS • Modern UI Design
          </p>
        </div>
      </div>
    </div>
  );
};

export default GemDynamicsDemo; 
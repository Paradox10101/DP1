// Tabs.jsx

import React, { useState, useRef, useEffect } from 'react';

const Tabs = ({
  children,
  defaultTab = "1",
  onChange,
  className = "",
  variant = "default"
}) => {
  // Inicializar activeTab con defaultTab
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [mounted, setMounted] = useState(false);
  const tabsRef = useRef(new Map());
  const tabs = React.Children.toArray(children);

  // Estado inicial del indicador
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: '0',
    transform: 'translateX(0)',
    opacity: '0'
  });

  // Función para actualizar el indicador
  const updateIndicator = (button) => {
    if (!button || !mounted) return;
    
    setIndicatorStyle({
      width: `${button.offsetWidth}px`,
      transform: `translateX(${button.offsetLeft}px)`,
      opacity: '1',
      transition: mounted ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
    });
  };

  // Efecto para inicializar el tab activo y el indicador
  useEffect(() => {
    setMounted(true);
    
    // Asegurarse de que el tab por defecto se active después del montaje
    setTimeout(() => {
      const activeButton = tabsRef.current.get(defaultTab);
      if (activeButton) {
        setActiveTab(defaultTab);
        updateIndicator(activeButton);
      }
    }, 0);
  }, [defaultTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
    const button = tabsRef.current.get(tabId);
    updateIndicator(button);
  };

  const getTabStyles = () => {
    switch (variant) {
      case 'default':
        return {
          container: 'flex w-full bg-gray-50/80 p-0.5 rounded-lg relative',
          tab: (isActive) => `
            relative flex-1 inline-flex items-center justify-center px-3 py-1.5
            text-sm font-medium min-w-0
            transition-all duration-200 ease-out
            ${isActive 
              ? 'text-gray-900 z-10'
              : 'text-gray-600 hover:text-gray-900'}
          `
        };
      default:
        return {
          container: 'flex w-full bg-gray-50/80 p-0.5 rounded-lg relative',
          tab: (isActive) => `
            relative flex-1 inline-flex items-center justify-center px-3 py-1.5
            text-sm font-medium min-w-0
            transition-all duration-200 ease-out
            ${isActive 
              ? 'text-gray-900 z-10'
              : 'text-gray-600 hover:text-gray-900'}
          `
        };
    }
  };

  const styles = getTabStyles();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className={styles.container}>
        {/* Indicator Background */}
        {variant !== 'pills' && variant !== 'minimal' && (
          <div
            className="absolute inset-0.5 bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
        )}
        
        {/* Tabs */}
        <div className="flex w-full relative z-10 h-10">
          {tabs.map((tab) => (
            <button
              key={tab.props.tabId}
              ref={el => el && tabsRef.current.set(tab.props.tabId, el)}
              onClick={() => handleTabChange(tab.props.tabId)}
              className={styles.tab(activeTab === tab.props.tabId)}
            >
              <span className="truncate">
                {tab.props.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden mt-4">
        {mounted && tabs.find(tab => tab.props.tabId === activeTab)}
      </div>
    </div>
  );
};

export default Tabs;

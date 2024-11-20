import { Tabs, Tab } from "@nextui-org/react";

const TabNavigation = ({ selectedKey, onSelectionChange }) => {
  const tabs = [
    { key: 1, title: "Simulación" },
    { key: 2, title: "Envíos" },
    { key: 3, title: "Almacenes" },
    { key: 4, title: "Vehículos" }
  ];

  return (
    <div className="w-full">
      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={onSelectionChange}
        aria-label="Opciones de Simulación"
        variant="solid"
        classNames={{
          tabList: "bg-default-100 p-0 rounded-lg",
          cursor: "bg-primary",
          tab: "text-sm h-10",
          tabContent: "group-data-[selected=true]:text-primary-foreground"
        }}
      >
        {tabs.map((tab) => (
          <Tab 
            key={tab.key} 
            title={tab.title}
            className={`${selectedKey !== tab.key ? "" : 'bg-white text-black'} rounded focus:outline-none`}
          />
        ))}
      </Tabs>
    </div>
  );
};

export default TabNavigation;

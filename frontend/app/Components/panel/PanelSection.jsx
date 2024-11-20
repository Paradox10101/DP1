import { NavItem } from './NavItem';

export function PanelSection({ title, items }) {
    return (
      <div className="flex flex-col gap-3 p-6 bg-gray-50 rounded-xl">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <NavItem
              key={idx}
              icon={item.icon}
              label={item.label}
              href={item.href}
            />
          ))}
        </div>
      </div>
    );
}
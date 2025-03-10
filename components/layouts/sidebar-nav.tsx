// Add UPA link for contractor organizations
{
  activeOrganization?.type === "CONTRACTOR" && (
    <SidebarItem
      icon={Calculator}
      href="/unit-price-analyses"
      label="Unit Price Analyses"
      active={pathname.startsWith("/unit-price-analyses")}
    />
  );
}

// Add Components Library link for contractor organizations
{
  activeOrganization?.type === "CONTRACTOR" && (
    <SidebarItem
      icon={Database}
      href="/components-library"
      label="Components Library"
      active={pathname.startsWith("/components-library")}
    />
  );
}

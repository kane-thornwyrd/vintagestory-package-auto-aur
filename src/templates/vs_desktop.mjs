export const filename = `vintagestory.desktop`

export const tpl = ({ version }) =>
  `[Desktop Entry]
Version=${version}
Type=Application
Name=Vintage Story
Comment=Innovate and explore in a sandbox world
Icon=/usr/share/pixmaps/vintagestory.xpm
Exec=/usr/bin/mono Vintagestory.exe
Path=/usr/share/vintagestory
NoDisplay=false
Categories=Game;
StartupNotify=false
Terminal=false`

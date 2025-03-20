{pkgs}: {
  deps = [
    pkgs.xorg.libXext
    pkgs.xorg.libXcomposite
    pkgs.cairo
    pkgs.pango
    pkgs.cups
    pkgs.atk
    pkgs.nspr
    pkgs.nss
    pkgs.xorg.libXtst
    pkgs.xorg.libXcursor
    pkgs.xorg.libXdamage
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libX11
    pkgs.alsaLib
    pkgs.dbus
    pkgs.gtk3
    pkgs.glib
  ];
}

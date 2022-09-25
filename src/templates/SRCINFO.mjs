export const filename = `.SRCINFO`

export const tpl = ({version, vs_archive_md5, vs_desktop_md5, vs_sh_md5}) =>
`pkgbase = vintagestory
pkgdesc = An in-development indie sandbox game about innovation and exploration
pkgver = ${version}
pkgrel = 1
url = https://www.vintagestory.at/
arch = any
license = custom
depends = mono
depends = opengl-driver
depends = openal
source = https://cdn.vintagestory.at/gamefiles/stable/vs_archive_${version}.tar.gz
source = vintagestory.desktop
source = vintagestory.sh
md5sums = ${vs_archive_md5}
md5sums = ${vs_desktop_md5}
md5sums = ${vs_sh_md5}

pkgname = vintagestory`

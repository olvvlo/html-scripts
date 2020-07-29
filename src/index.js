const { src, dest, parallel, series, watch } = require('gulp')
const babel = require('gulp-babel')
const swig = require('gulp-swig')
const useref = require('gulp-useref')
const gif = require('gulp-if')
const uglify = require('gulp-uglify')
const cleanCss = require('gulp-clean-css')
const htmlmin = require('gulp-htmlmin')
const del = require('del')
const merge = require('deepmerge')
const browserSync = require('browser-sync')

const cwd = process.cwd()

let conf = {
  build: {
    src: 'src',
    dist: 'build',
    temp: '.tmp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.css',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
  const config = require(`${cwd}/pages.conf.js`)
  conf = merge(conf, config)
} catch (error) { }

const bs = browserSync.create()

const style = () => {
  return src(conf.build.paths.styles, {
    base: conf.build.src,
    cwd: conf.build.src
  })
    .pipe(dest(conf.build.temp))
}

const script = () => {
  return src(conf.build.paths.scripts, {
    base: conf.build.src,
    cwd: conf.build.src
  })
    .pipe(babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(conf.build.temp))
}

const page = () => {
  return src(conf.build.paths.pages, {
    base: conf.build.src,
    cwd: conf.build.src
  })
    .pipe(swig({ data: conf.data }))
    .pipe(dest(conf.build.temp))
}

const image = () => {
  return src(conf.build.paths.images, {
    base: conf.build.src,
    cwd: conf.build.src
  })
    .pipe(dest(conf.build.dist))
}

const font = () => {
  return src(conf.build.paths.fonts, {
    base: conf.build.src,
    cwd: conf.build.src
  })
    .pipe(dest(conf.build.dist))
}

const extra = () => {
  return src('**', { base: conf.build.public, cwd: conf.build.public })
    .pipe(dest(conf.build.dist))
}

const clean = () => {
  return del([conf.build.dist, conf.build.temp])
}

const useRef = () => {
  return src(conf.build.paths.pages, {
    base: conf.build.temp,
    cwd: conf.build.temp
  })
    .pipe(useref({ searchPath: [conf.build.temp, '.'] }))
    .pipe(gif(/\.js$/, uglify()))
    .pipe(gif(/\.css$/, cleanCss()))
    .pipe(gif(/\.html$/, htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(conf.build.dist))
}

const serve = () => {

  watch(conf.build.paths.styles, { cwd: conf.build.src }, style)
  watch(conf.build.paths.scripts, { cwd: conf.build.src }, script)
  watch(conf.build.paths.pages, { cwd: conf.build.src }, page)

  watch(['**'], { cwd: conf.build.public }, bs.reload)

  watch([
    conf.build.paths.images,
    conf.build.paths.fonts
  ], { cwd: conf.build.src }, bs.reload)

  bs.init({
    notify: false,
    files: `${conf.build.temp}/**`,
    server: {
      baseDir: [conf.build.temp, conf.build.src, conf.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const compile = parallel(style, script, page)

const build = series(
  clean,
  parallel(
    series(
      compile,
      useRef
    ),
    image,
    font,
    extra
  )
)

const dev = series(compile, serve)

module.exports = {
  clean,
  build,
  dev
}

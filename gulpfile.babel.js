import gulp     from 'gulp';
import ts       from 'gulp-typescript';
import del      from 'del';
import jsr      from 'jasmine-spec-reporter';
import maps     from 'gulp-sourcemaps';
import shell    from 'gulp-shell';
import merge    from 'merge2';
import remap    from 'remap-istanbul/lib/gulpRemapIstanbul';
import concat   from 'gulp-concat';
import uglify   from 'gulp-uglify';
import jasmine  from 'gulp-jasmine';
import istanbul from 'gulp-istanbul';

const paths = {
    src:     'src/astrologyjs.ts',
    spec:    'spec',
    specs:   'spec/**/*.spec.js',
    dist_js: 'dist/js',
    dist_ts: 'dist/ts',
    dist:    'dist'
};

const clean = () => del(['dist']);
export { clean };

export function build_dist_js() {
    let project = proj.src()
        .pipe(maps.init())
        .pipe(ts(proj));

    let js = project.js
        .pipe(concat('astrologyjs.min.js'));

    let dts = project.dts
        .pipe(concat('astrologyjs.d.ts'));

    return merge([
        js.pipe(maps.write('.')).pipe(gulp.dest(paths.dist_js)),
        dts.pipe(gulp.dest(paths.dist_js))
    ]);
}

export function build_dist() {
    let proj = gulp.src(["src/astrologyjs.ts"])
        .pipe(maps.init())
        .pipe(ts({
            "target": "es6",
            "declaration": true,
            "noImplicitAny": true,
            "suppressImplicitAnyIndexErrors": true,
            "noImplicitReturns": true,
            // "strictNullChecks": true,
            "removeComments": true,
            "sourceMap": true
        }));

    let js = proj.js;

    let dts = proj.dts
        .pipe(concat('astrologyjs.d.ts'));

    return merge([
        js.pipe(maps.write('.')).pipe(gulp.dest(paths.dist)),
        dts.pipe(gulp.dest(paths.dist))
    ]);
}

const build = gulp.series(clean, build_dist);
export { build };

const clean_specs = () => del(["spec/*.js"]);
export { clean_specs };

export function build_specs() {
    return gulp.src(["src/**/*.spec.ts", "src/astrologyjs.ts"])
        .pipe(maps.init())
        .pipe(ts({
            "target": "ES6",
            "module": "commonjs"
        }))
        .pipe(maps.write({includeContent: false, sourceRoot: "../src"}))
        .pipe(gulp.dest(paths.spec));
}

export function pre_spec() {
    return gulp.src(["spec/**/*.js","!spec/**/*.spec.js"])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
}

export function run_specs() {
    return gulp.src(paths.specs)
        .pipe(shell('clear'))
        .pipe(jasmine({
            reporter: new jsr()
        }))
        .pipe(istanbul.writeReports({
            print: "detail"
        }));
}

export function remap_coverage() {
    return gulp.src('coverage/coverage-final.json')
        .pipe(remap({
            basepath: "src",
            reports: {
                "html": "coverage/html-report",
                "json": "coverage/coverage-final.json",
                "lcovonly": "coverage/lcov.info"
            }
        }));
}

const spec = gulp.series(clean_specs, build_specs, pre_spec, run_specs, remap_coverage);
export { spec };

export function watch() {
    gulp.watch(paths.src, spec);
}

export default watch;
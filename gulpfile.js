const gulp = require('gulp');
const gulpTs = require('gulp-typescript');
const gulpTslint = require('gulp-tslint');
const tslint = require('tslint');
const del = require('del');

const project = gulpTs.createProject('tsconfig.json');
const typeCheck = tslint.Linter.createProgram('tsconfig.json');

gulp.task('lint', () => {
	gulp.src('./src/**/*.ts')
		.pipe(gulpTslint({
			configuration: 'tslint.json',
			formatter: 'prose',
			program: typeCheck
		}))
		.pipe(gulpTslint.report());
})

gulp.task('build', () => {
	del.sync(['./build/**/*.*']);
	gulp.src('./src/**/*.ts')
		.pipe(project())
		.pipe(gulp.dest('build/'));
	gulp.src('./src/**/*.js')
		.pipe(gulp.dest('build/'));
	gulp.src('./src/**/*.json')
		.pipe(gulp.dest('build/'));
	gulp.src('./src/**/*.png')
		.pipe(gulp.dest('build/'));
	gulp.src('./src/**/*.ttf')
		.pipe(gulp.dest('build/'));
});
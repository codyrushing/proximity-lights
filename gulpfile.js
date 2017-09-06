var gulp = require('gulp'),
    runSequence = require('run-sequence'),
    gulpPlugins = require('gulp-load-plugins')(),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream');

var paths = {
  entries: [
    {
      in: './src/public/src/js/app.js',
      out: 'app.js'
    }
  ],
  build: {
    scripts: './src/public/js/'
  }
};

var handleErrors = function(err) {
  var args = Array.prototype.slice.call(arguments);
  gulpPlugins.notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>',
    time: 1
  }).apply(this, args);
  if(this && this.emit){
    this.emit('end'); // Keep gulp from hanging on this task
  } else {
    console.warn('handleErrors called outside of the context of a Stream');
  }
  if(shouldExitOnError) {
    process.exit(1);
  }
};

var buildScript = function(file, out) {
  const browserify = require('browserify');
  const watchify = require('watchify');

  var props = isWatching ? watchify.args : {};

  props.entries = [file];

  // watchify() if watch requested, otherwise run browserify() once
  var b = browserify(file, {
    cache: {},
    packageCache: {},
    debug: true,
    fullPaths: true
  });

  if(isWatching){
    b.plugin(watchify, {
      ignoreWatch: /!node_modules/ // this ignore node_modules for watching, makes rebundling faster
    });
  }

  function rebundle() {
    var bundle = b.bundle();
    // If we are watchings, we want to alert on failed build, otherwise
    // we want the whole process to exit with a failed exit code
    // if(isWatching){
    //   bundle = bundle.on('error', handleErrors);
    // }
    bundle.on('error', handleErrors);

    return bundle
      .pipe(source(out))
      .pipe(gulp.dest(paths.build.scripts))
      .pipe(gulpPlugins.notify('JS bundled: <%= file.relative %>'))
  }

  function onChange() {
    gulpPlugins.util.log('Rebundling');
    // run lint, then rebundle
    rebundle();
  }

  // listen for an update and run rebundle
  b.on('update', function(files) {
    files.forEach(function(file) {
      gulpPlugins.util.log('Change in: ' + file);
    });
    onChange();
  });

  // listen for an update and run rebundle
  b.on('log', function(message) {
    gulpPlugins.util.log(message);
  });

  // run it once the first time buildScript is called
  return rebundle();
};

gulp.task('scripts', function(done) {
  var i = 0;
  var checkFinished = () => {
    if(i === paths.entries.length){
      done();
    }
  };
  paths.entries.forEach(entry => {
    buildScript(entry.in, entry.out)
      .on('end', () => {
        i++;
        checkFinished();
      });
  });
  checkFinished();
});

gulp.task('watch', function() {
  isWatching = true;
  runSequence('scripts');
});

gulp.task('build', ['scripts'], function(){
  return;
});

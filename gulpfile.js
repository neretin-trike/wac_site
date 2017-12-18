var gulp = require('gulp'),
    less = require('gulp-less'),
    browserSync = require('browser-sync'); // Подключаем Browser Sync
    pug = require('gulp-pug');

gulp.task('less', function(){ // Создаем таск "less"
    return gulp.src('app/less/style.less') // Берем источник
        .pipe(less()) // Преобразуем less в CSS посредством gulp-less
        .pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
        .pipe(browserSync.reload({stream: true})) // Обновляем CSS на странице при изменении
});

gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync({ // Выполняем browser Sync
        server: { // Определяем параметры сервера
            baseDir: 'app' // Директория для сервера - app
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('pug', function(){
    return gulp.src('app/pages/*.pug')
        .pipe( pug({pretty:true}))
        .pipe(gulp.dest('app')) // Выгружаем результата в папку app/css
});

gulp.task('watch', ['browser-sync', 'less'], function() {
    gulp.watch('app/**/*.less', ['less']); // Наблюдение за less файлами
    gulp.watch('app/**/*.pug', ['pug']); // Наблюдение за less файлами
    gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
    // gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
});

//Переменная дял выбора используемого препроцессора (sass/scss/less)
let preprocessor = 'scss'

//Методом деструктуризации создаем константы (можео будет обращаться напрямую - без glup.parallel)
const {
    src,
    dest,
    parallel,
    series,
    watch
} = require('gulp');

//Создание константы для обращения к browser-sync, создание подключения 
//Позволяет просматривать подключение на других устройствах при подключении к wi-fi по укзазанному ip-адресу (external)
const browserSync = require('browser-sync').create();
//Создаем константу для модуля gulp-concat (модуль для обьединения файлов)
const concat = require('gulp-concat');
//Создаем константу для модуля gulp-concat (модуль для сжатия файлов)
const uglify = require('gulp-uglify-es').default;
//Создаем константу для модуля gulp-sass (модуль для работы с sass и scss)
const scss = require('gulp-sass');
const sass = require('gulp-sass');
const less = require('gulp-less');
//Создаем константу для модуля gulp-autoprefixer (модуль позволяет автоматически расставлять префиксы стилей для старых браузеров)
const autoprefixer = require('gulp-autoprefixer');
//Создаем константу для модуля gulp-autoprefixer (модуль позволяет уменьшить фалы стилей)
const cleancss = require('gulp-clean-css');
//Создаем константу для модуля gulp-imagemin (модуль позволяет уменьшить фалы изображений)
const imagemin = require('gulp-imagemin');
//Создаем константу для модуля gulp-newer (модуль позволяет определить какие файлы были изменены, какие - нет)
const newer = require('gulp-newer');
//Создаем константу для модуля del (модуль позволяет удалять файлы и папки)
const del = require('del');

//функция для работы с browserSync
function fnBrowserSync() {
    //инициализация с указанием пераметров
    browserSync.init({
        server: {
            //базовая дирректория
            baseDir: 'app/',
            //вывод уведомлений
            notify: false
            //без подключения к интеренту browser-sync работать не будет
            //для отключения раздачи ip-адресов используется параметр online
            //online: false
        }
    })
}

//Функция для обработки скриптов проекта
function fnScript() {
    //берем исходник файла (для примера рассмотрим ситуацию когда фалов несколько и конкатенируем их)
    //для примера подключим еще jquery (сначала нужно установить  npm i jquery --save-dev)
    //файлы выполняются слева-направо, поэтому если в app.js используется jquery, то jquery идет в начале
    return src(['node_modules/jquery/dist/jquery.min.js',
            'app/js/app.js'
        ])
        //Конкатенируем фалы скриптов в один файл с указанным названием
        .pipe(concat('app.min.js'))
        //Сжимаем файл
        .pipe(uglify())
        //Выгружаем результат по указанному пути
        .pipe(dest('app/js/'))
        //Слежение за изменениями
        //Stream - слежение за изменениями без перезагрузки 
        //(в случае со скриптами все-равно будет перезагрузка страницы, например, если использовать для css - то не будет перезагрузки страницы)
        //Используется константа взятая для обращения к browser-sync модулю
        .pipe(browserSync.stream())
}

//Функция для обработки стилей
function fnStyles() {
    //берем файл main.scss (.scss/.sass/.less - записано в переменной preprocessor)
    return src('app/' + preprocessor + '/main.' + preprocessor)
        //Обработка файла препроцессора
        .pipe(eval(preprocessor)())
        .pipe(concat('main.min.css'))
        //Расставляем автопрефиксы стилей с параметрами
        .pipe(autoprefixer({
            //Для последних 10 версий браузеров
            overrideBrowserslist: ['last 10 versions'],
            //Автопрефиксы для grid (в частности для IE - он с grid не совсем корректно работет)
            grid: true
        }))
        //Минифицируем файл стилей
        //Первый парметр убирает все пробелы, пишет код в строку
        //Второй параметр разворачивает код в читаемый вид (здесь не нужен)
        .pipe(cleancss(({
            level: {
                1: {
                    specialComments: 0
                }
            }
            /*,
                        format: 'beautify'
            */
        })))
        .pipe(dest('app/css/'))
        //Слежение за изменениями
        //Stream - слежение за изменениями без перезагрузки 
        //(в случае со скриптами все-равно будет перезагрузка страницы, например, если использовать для css - то не будет перезагрузки страницы)
        //Используется константа взятая для обращения к browser-sync модулю
        .pipe(browserSync.stream())
}

//Функция для обработки изображений проекта
function fnImages() {
    //Берем все изображения по указанному пути
    return src('app/img/src/**/*')
        //Определяем какие изображения еще не были минифицированы, указав путь, куда будут складываться изображения
        .pipe(newer('app/img/dest/'))
        //Оптимизируем изображения с помощью модуля imagemin
        .pipe(imagemin())
        //Выгружаем оптимизированные изображения по указанному пути
        .pipe(dest('app/img/dest/'))
        .pipe(browserSync.stream())
}

//Функция для удаления содержимого папки dest с помощью модуля node js - 'del'
function fnCleanImg() {
    return del('app/img/dest/**/*', {
        force: true
    })
}

//Функция для удаления содержимого папки dist
function fnCleanDist() {
    return del('dist/**/*', {
        force: true
    })
}

//Фуенкция для копирования данных перед сборкой проекта
//Параметр {base: 'app'} служит для сохранения структуры папок как в источнике (в данном случае как в папке app)
function fnBuildCopy() {
    return src(['app/css/**/*.min.css',
            'app/js/**/*.min.js',
            'app/img/dest/**/*',
            'app/**/*.html'
        ], {
            base: 'app'
        })
        .pipe(dest('dist'))
}

//Функция для автоматического обновления страницы при сохранении изменений в файлах
function fnStartWatch() {
    //Для отслеживания одного файла
    //watch('app/js/app.js)

    //Для отслеживания изменений в нескольких файлах
    //Исключаем файлы, не требующиен отслеживания, для исключения повторного запуска функции

    //Слежение за html файлами
    watch('app/**/*.html').on('change', browserSync.reload)

    //Слежение за стилями
    watch(['app/**/' + preprocessor + '/**/*', '!app/**/app.min.js'], fnStyles);

    //Слежение за скриптами
    watch(['app/**/*.js', '!app/**/app.min.js'], fnScript);

    //Слежение за изображениями
    watch('app/img/src/**/*', fnImages) //.on('change', browserSync.reload)

}

//Экспортиркем функцию
//Для запуска набрать в командной строке gulp 'название после exports'
exports.browsersync = fnBrowserSync;
exports.script = fnScript;
exports.styles = fnStyles;
exports.images = fnImages;
exports.cleanImg = fnCleanImg;
exports.build = series(fnCleanDist, fnStyles, fnScript, fnImages, fnBuildCopy);
//Экспортируем в дефолтный таск (выполняется по дефолту при запуске gulp)
//Для запуска набрать gulp в командной строке
//Для корректного запуска используются не названия из exports, а названия функций
exports.default = parallel(fnScript, fnStyles, fnImages, fnBrowserSync, fnStartWatch);
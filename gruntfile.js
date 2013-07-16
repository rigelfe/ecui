module.exports = function(grunt) {

    // console.log(grunt);
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            cssSrc: 'src/css',
            cssDest: 'dist/',

            jsSrc: 'src/js',
            jsDest: 'dist/'
        },
        //合并
        concat: {
            options: {
                separator: '\n'
            },
            css: {
                src: [
                    '<%= dirs.cssSrc %>/button.css',
                    '<%= dirs.cssSrc %>/label.css',
                    '<%= dirs.cssSrc %>/input.css',
                    '<%= dirs.cssSrc %>/scrollbar.css',
                    '<%= dirs.cssSrc %>/select.css',
                    '<%= dirs.cssSrc %>/checkbox.css',
                    '<%= dirs.cssSrc %>/radio.css',
                    '<%= dirs.cssSrc %>/table.css',
                    '<%= dirs.cssSrc %>/treeview.css',
                    '<%= dirs.cssSrc %>/check-tree.css',
                    '<%= dirs.cssSrc %>/calendar.css',
                    '<%= dirs.cssSrc %>/month-calendar.css',
                    '<%= dirs.cssSrc %>/multi-calendar.css',
                    '<%= dirs.cssSrc %>/pop.css',
                    '<%= dirs.cssSrc %>/form.css',
                    '<%= dirs.cssSrc %>/messagebox.css',
                    '<%= dirs.cssSrc %>/message-bar.css',
                    '<%= dirs.cssSrc %>/pager.css',
                    '<%= dirs.cssSrc %>/custom-pager.css',
                    '<%= dirs.cssSrc %>/flash-pager.css',
                    '<%= dirs.cssSrc %>/query-tab.css',
                    '<%= dirs.cssSrc %>/multi-select.css',
                    '<%= dirs.cssSrc %>/editor.css',
                    '<%= dirs.cssSrc %>/area.css',
                    '<%= dirs.cssSrc %>/data-tree.css',
                    '<%= dirs.cssSrc %>/input-tree.css',
                    '<%= dirs.cssSrc %>/tip.css',
                    '<%= dirs.cssSrc %>/score.css',
                    '<%= dirs.cssSrc %>/messagebox.css',
                    '<%= dirs.cssSrc %>/lite-table.css',
                    '<%= dirs.cssSrc %>/custom.css',
                    '<%= dirs.cssSrc %>/table-editor.css',
                    '<%= dirs.cssSrc %>/x-calendar.css',
                    '<%= dirs.cssSrc %>/fixed-table.css',
                    '<%= dirs.cssSrc %>/suggest.css'
                ],
                dest: '<%= dirs.cssDest %>/ecui-concat.css'
            },
            ecui: {
                src: [
                    '<%= dirs.jsSrc %>/base/ecui.js',
                    '<%= dirs.jsSrc %>/base/adapter.js',
                    '<%= dirs.jsSrc %>/base/core.js',
                    '<%= dirs.jsSrc %>/base/control.js',
                    '<%= dirs.jsSrc %>/base/button.js',
                    '<%= dirs.jsSrc %>/base/scrollbar.js',
                    '<%= dirs.jsSrc %>/base/panel.js',
                    '<%= dirs.jsSrc %>/base/items.js',
                    '<%= dirs.jsSrc %>/base/input-control.js',
                    // 'base/decorate.js',
                    // 'base/combine.js',

                    '<%= dirs.jsSrc %>/tools/messagebox.js',
                    '<%= dirs.jsSrc %>/tools/score.js',
                    '<%= dirs.jsSrc %>/tools/tip.js',

                    '<%= dirs.jsSrc %>/checkbox/checkbox.js',
                    '<%= dirs.jsSrc %>/radio/radio.js',
                    '<%= dirs.jsSrc %>/label/label.js',

                    '<%= dirs.jsSrc %>/input/input.js',
                    '<%= dirs.jsSrc %>/input/suggest.js',

                    '<%= dirs.jsSrc %>/form/form.js',
                    '<%= dirs.jsSrc %>/form/pop.js',

                    '<%= dirs.jsSrc %>/select/select.js',
                    '<%= dirs.jsSrc %>/select/cascade-select.js',
                    '<%= dirs.jsSrc %>/select/multi-select.js',
                    '<%= dirs.jsSrc %>/select/listbox.js',

                    '<%= dirs.jsSrc %>/calendar/month-view.js',
                    '<%= dirs.jsSrc %>/calendar/month-calender.js',
                    '<%= dirs.jsSrc %>/calendar/calendar.js',
                    '<%= dirs.jsSrc %>/calendar/multi-calendar.js',
                    '<%= dirs.jsSrc %>/calendar/x-calendar-view.js',
                    '<%= dirs.jsSrc %>/calendar/x-calendar-layer.js',
                    '<%= dirs.jsSrc %>/calendar/x-calendar.js',

                    '<%= dirs.jsSrc %>/tree/tree-view.js',
                    '<%= dirs.jsSrc %>/tree/check-tree.js',
                    '<%= dirs.jsSrc %>/tree/data-tree.js',
                    '<%= dirs.jsSrc %>/tree/input-tree.js',

                    '<%= dirs.jsSrc %>/tab/tab.js',
                    '<%= dirs.jsSrc %>/tab/query-tab.js',

                    '<%= dirs.jsSrc %>/editor/editor.js',
                    '<%= dirs.jsSrc %>/editor/table-editor.js',

                    '<%= dirs.jsSrc %>/table/table.js',
                    '<%= dirs.jsSrc %>/table/locked-table.js',
                    '<%= dirs.jsSrc %>/table/custom-table.js',
                    '<%= dirs.jsSrc %>/table/fixed-table.js',
                    '<%= dirs.jsSrc %>/table/lite-table.js',

                    '<%= dirs.jsSrc %>/pager/pager.js',
                    '<%= dirs.jsSrc %>/pager/custom-pager.js',
                    '<%= dirs.jsSrc %>/pager/flash-pager.js'
                ],
                dest: '<%= dirs.jsDest %>/ecui.js'
            },
            business: {
                src: [
                    "<%= dirs.jsSrc %>/business/message-bar.js",
                ],
                dest: '<%= dirs.jsDest %>/business.js'
            }
        },
        //js压缩
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            ecui: {
                // options: {
                //     sourceMap: '<%= dirs.jsDest %>/map/ecui-map.js'
                // },
                src: '<%= dirs.jsDest %>/ecui.js',
                dest: '<%= dirs.jsDest %>/ecui-min.js'
            },
            business: {
                src: '<%= dirs.jsDest %>/business.js',
                dest: '<%= dirs.jsDest %>/business-min.js'
            }
        },
        cssmin: {
            minify: {
                src: '<%= dirs.jsDest %>/ecui-concat.css',
                dest: '<%= dirs.jsDest %>/ecui.css'          
            }
        },
        clean: {
            removeMiddleFiles: [
                '<%= dirs.jsDest %>/ecui-concat.css'
            ]
        },
        copy: {
            img: {
                files: [
                    {
                        src: ['src/ecui-css/img/*'], 
                        dest: 'dist/img/'
                    }
                ]
            }
        }
    });



    // Load the plugin that provides the "concat" task.
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Load the plugin that provides the "copy" task.
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    // Load the plugin that provides the "cssmin" task.
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify', 'cssmin' /*'copy:img',*/ , 'clean']);
    //grunt.registerTask('debug', ['concat', 'minified']);
};
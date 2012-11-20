(function($) {
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };
    
    var Formator = function($el, formStructure) {
        this.$_el = $el;
        this._structure = formStructure;
        this._rowTpl =  _.template('<div class="form_field"><label>{{ title }}</label>{{ content }}</div>');
        
        this.init();
    };
    
    Formator.prototype = {
        init: function() {
            this.render();
            this.$_el.find('form').on('submit.formator_submit', $.proxy(this._handleSubmit ,this));
        },
        
        render: function() {
            var _formTpl = _.template('<form><div class="form_area"><div class="form_fields"></div><div class="form_submit"><input type="submit" value="{{ submit }}" name="commit"><span class="formator-spinner"></span></div></div></form>'),
                $form = $(_formTpl({
                    'submit': this._structure.submit_txt
                })),
                $fields = $form.find('.form_fields'),
                _sortedData = _.sortBy(this._structure.data, function(f) { return f.position; });
                
                
            _.each(_sortedData, function(field) {
                switch (field.type) {
                    case "string": 
                        $fields.append(this._getInputRow(field));
                    break;
                    case "text": 
                        $fields.append(this._getTextareaRow(field));
                    break;
                    case "radio":
                        $fields.append(this._getRadioBtnsRow(field));
                    break;
                    case "select":
                        $fields.append(this._getSelectRow(field));
                    break;
                }
            }, this);
            
            this.$_el.append($form);
        },
        
        _getInputRow: function(field) {
            var _inputTpl = _.template('<input type="text" name="formator-name-{{ position }}" value="{{ val }}" class="form_field_field form_field_textfield form_field_size_large">'),
                contents = _inputTpl({ 
                    'val': field.value,
                    'position': field.position 
                }),
                html = this._rowTpl({
                    'title': field.name,
                    'content': contents
                });
            return $(html).data('field', field);
        },
        
        _getTextareaRow: function(field) {
            var _inputTpl = _.template('<textarea rows="4" name="formator-name-{{ position }}" cols="20" class="form_field_field form_field_textarea">{{ val }}</textarea>'),
                contents = _inputTpl({ 
                    'val': field.value,
                    'position': field.position 
                }),
                html = this._rowTpl({
                    'title': field.name,
                    'content': contents
                });
            return $(html).data('field', field);
        },
        
        _getRadioBtnsRow: function(field) {
            var _radioTpl =  _.template('<div><input type="radio" value="{{ name }}" name="formator-name-{{ position }}" class="form_field_field form_field_radio" {{ checked }}/>{{ name }}</div>'),
                contents = '',
                html;
                
            _.each(field.options, function(option) {
                contents += _radioTpl({
                    'position': field.position,
                    'name': option,
                    'checked': ((option == field.value) ? 'checked="checked"': '')
                });
            }, this);
            
            html = this._rowTpl({
                'title': field.name,
                'content': contents
            });
            return $(html).data('field', field);
        },
        
        _getSelectRow: function(field) {
            var _selectTpl = _.template('<select name="formator-name-{{ position }}" class="form_field_field form_field_select">{{ options }}</select>'),
                _optionTpl = _.template('<option {{ selected }} value="{{ name }}">{{ name }}</option>'),
                optContents = '',
                contents, html;
                
            _.each(field.options, function(option) {
                optContents += _optionTpl({
                    'name': option,
                    'selected': ((option == field.value) ? 'selected="selected"': '')
                });
            }, this);
            
            contents = _selectTpl({
                'position': field.position,
                'options': optContents
            });
            
            html = this._rowTpl({
                'title': field.name,
                'content': contents
            });
            return $(html).data('field', field);
        },
        
        _getSaveData: function() {
            var $fields = this.$_el.find('.form_field'),
                formData = _.clone(this._structure);
            
            _.each($fields, function(f) {
                var $f = $(f),
                    o = $f.data('field'),
                    value,
                    data = _.find(formData.data, function(d) { return d.position == o.position; });
                    
                if (_.contains(['text', 'string', 'select'], o.type)) {
                    value = $f.find('.form_field_field').val();
                } else if (o.type == 'radio') {
                    value = $f.find('.form_field_field:checked').val();
                }
                if (o.bind) { formData[o.bind] = value || ''; }
                data.value = value;
            }, this);
            
            return formData;
        },
        
        _validate: function() {
            var valid = true,
                $fields = this.$_el.find('.form_field');
                
            $fields.removeClass('form_field_with_errors');
            $fields.find('.form_field_error').remove();
                
            _.each($fields, function(f) {
                var $f = $(f),
                    o = $f.data('field'),
                    value;
                    
                if (o.required) {
                    var regexp = new RegExp(o.valid_pattern, "gi");
                    if (_.contains(['text', 'string', 'select'], o.type)) {
                        value = $f.find('.form_field_field').val();
                    } else if (o.type == 'radio') {
                        value = $f.find('.form_field_field:checked').val();
                    }
                    if (!regexp.test(value)) {
                        valid = false;
                        $f.addClass('form_field_with_errors');
                        $f.append('<div class="form_field_error">' + o.invalid_msg + '</div>');
                    }
                }
            }, this);
            return valid;
        },
        
        _handleSubmit: function(event) {
            event.preventDefault();
            var valid = this._validate();
            if (valid === true) {
                this.save();
            }
        },
        
        save: function() {
            this.$_el.find('.formator-spinner').spin('tiny');
            var data = this._getSaveData();
            $.ajax({
                url: data.url,
                method: 'post',
                data: JSON.stringify(data),
                dataType: 'json',
                success: $.proxy(function () {
                    this.$_el.find('.formator-spinner').spin(false);
                    alert(this._structure.success);
                }, this),
                error: $.proxy(function(jqXHR, textStatus, errorThrown) {
                    this.$_el.find('.formator-spinner').spin(false);
                    alert(textStatus);
                }, this)
            });
            
        }
    };
    
    $.fn.formator = function(options) {
        return this.each(function() {
            var m = new Formator($(this), options);
            $(this).data('Fromator', m);
        });
    }; 
      
})(jQuery);
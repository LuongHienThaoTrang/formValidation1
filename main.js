
const Validator = (options) => {
    
    const getParent = (element, selector) => {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {}

    // Hàm thực hiện validate
    const validate = (inputElement, rule) => {
        var errorMesage
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector]

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi dừng việc kiểm tra
        for(var i = 0; i < rules.length; i++) {

            switch(inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMesage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMesage = rules[i](inputElement.value);
            }

            if(errorMesage) break; 
        }
         
        if (errorMesage) {
            errorElement.innerText = errorMesage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }
        return !errorMesage
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form)
    if (formElement) {

        // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input, ...)
        options.rules.forEach(rule => {

            // Khi submit form bỏ qua hành vị mặc định
            formElement.onsubmit = (e) => {
                // Bỏ qua hành vi mặc định
                e.preventDefault();

                var isFormValid = true;

                // Lặp qua từng rule và validate
                options.rules.forEach(rule => {
                    var inputElement = formElement.querySelector(rule.selector)
                  
                    var isValid = validate(inputElement, rule)
                    if (!isValid) {
                        isFormValid = false
                    }
                })
                

                if (isFormValid) {
                    if (typeof options.onSubmit === 'function') {

                        var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                        
                        var formValues = Array.from(enableInputs).reduce((values, input) => {
                            switch(input.type) {
                                case 'radio':
                                        // Ta sẽ tìm input.name
                                        values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                        break;
                                case 'checkbox':
                                    if(!input.matches(':checked'))  {
                                        if(!Array.isArray(values[input.name])) {
                                            values[input.name] = '';
                                        }
                                        return values;
                                    }
                                    // Nếu nó không phải là Array, thì ta sẽ gán cho nó bằng 1 array trống
                                    if(!Array.isArray(values[input.name])) {
                                        values[input.name] = [];
                                    }
                                    // Nếu nó là array ta sẽ push value vào
                                    values[input.name].push(input.value);
                                    break;
                                case 'file':
                                    values[input.name] = input.files;
                                    break;
                                default:
                                    values[input.name] = input.value; //Vế đầu là gán input value cho object value
                            }
                            return values; //Vế 2 là return values
                        }, {});
        
                        options.onSubmit(formValues);
                    } 
                    // Trường hợp submit với hành vi mặc định
                    else {
                        formElement.submit();
                    }
                }
            }

            // Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector)

            Array.from(inputElements).forEach((inputElement) => {
                 // Xử lý trường hợp blur khỏi input
                inputElement.onblur = () => {
                    validate(inputElement, rule)
                }
                
                // Xử lý mỗi khi người dùng nhập vào input 
                inputElement.oninput = () => {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                    errorElement.innerText = ''
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            })
        })
    }
}

// Định nghĩa các rules
/** Nguyên tắc của các rules
 * 1. Khi có lỗi => Thì trả ra message lỗi
 * 2. Khi không có lỗi => Thì không trả ra cái gì cả (undefined)
*/
Validator.isRequired = (selector, message) => {
    return {
        selector,
        test(value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    };
}

Validator.isEmail = (selector, message) => {
    return {
        selector,
        test(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email'
        }
    };
}

Validator.minLength = (selector, min, message) => {
    return {
        selector,
        test(value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự`
        }
    };
}

Validator.isConfirmed = (selector, getConfirmValue, message) => {
    return {
        selector,
        test(value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    };
}
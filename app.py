from flask import Flask, Blueprint, render_template

fct_blueprint = Blueprint('fct', __name__, template_folder='templates', static_folder='static')

@fct_blueprint.route('/')
def fct_home():
    return render_template('fct_index.html')

if __name__ == '__main__':
    app = Flask(__name__)
    app.register_blueprint(fct_blueprint, url_prefix='/')
    app.run(debug=True)

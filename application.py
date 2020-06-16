from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.schema import MetaData

#################################################
# Database Setup
#################################################
pg_conn_string = 'postgresql://group1:project2@education1.c1nbp1eyrpzu.us-east-2.rds.amazonaws.com:5432/factbook1'
engine = create_engine(pg_conn_string)
meta = MetaData()
meta.reflect(bind=engine,views=True)

# EB looks for an 'application' callable by default.
application = Flask(__name__)
cors = CORS(application)

@application.route("/")
def welcome():
    return render_template("index.html")

@application.route("/api")
def api_routes():
    return (
        "Available Routes:<br/>"
        "/api/years<br/>"
        "/api/countries<br/>"
        "/api/properties<br/>"
        "/api/worldMapData<br/>"
        "/api/&lt;year&gt;<br/>"
        "<i>where years are YYYY</i>"
    )

@application.route("/api/years")
def years():
    result = engine.execute("select * from v_years")
    year_list = [row.year for row in result]
    return jsonify(year_list)

@application.route("/api/countries")
def countries():
    result = engine.execute("select * from v_countries")
    return jsonify([row.country for row in result])

@application.route("/api/properties")
def properties():
    return jsonify([c.name for c in meta.tables['all_data'].columns][5:])

@application.route("/api/<int:year>")
def year_callback(year):
    sql = f"""
       select * from all_data
       where year = {year}
       and education_expenditures is not null
       and literacy_rate is not null
       and unemployment_rate is not null
       and purchasing_power_parity is not null 
       and distribution_of_family_income is not null
    """
    df = pd.read_sql(sql, engine)
    return df.to_json(orient='records')

@application.route("/api/worldMapData")
def worldMapData_callback():
    df = pd.read_sql("""
        select year,country, latitude,longitude, education_expenditures,
        literacy_rate, unemployment_rate, purchasing_power_parity,distribution_of_family_income
        from all_data 
        where education_expenditures is not null 
        and literacy_rate is not null 
        and unemployment_rate is not null 
        and purchasing_power_parity is not null 
        and distribution_of_family_income is not null
    """, engine)
    return df.to_json(orient='records')    

@application.route("/about")
def about_html():
    return render_template("about.html")

@application.route("/map")
def world_map_html():
    return render_template("worldMap.html")

@application.route("/scatter")
def scatter_plot_html():
    return render_template("scatterPlot.html")

@application.route("/bar")
def barchart_html():
    return render_template("barchart.html")

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()
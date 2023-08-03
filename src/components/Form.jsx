// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import {useEffect, useState} from "react";
import DatePicker from "react-datepicker";
import styles from "./Form.module.css";
import Button from "./Button.jsx";
import BackButton from "./BackButton.jsx";
import {useUrlPosition} from "../hooks/useUrlPosition.js";
import Message from "./Message.jsx";
import Spinner from "./Spinner.jsx";
import uniqid from "uniqid";
import "react-datepicker/dist/react-datepicker.css";
import {useCities} from "../contexts/CitiesContext.jsx";
import {useNavigate} from "react-router-dom";

export function convertToEmoji(countryCode) {
	const codePoints = countryCode
		.toUpperCase()
		.split("")
		.map(char => 127397 + char.charCodeAt());
	return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
	const [lat, lng] = useUrlPosition();
	const [cityName, setCityName] = useState("");
	const [country, setCountry] = useState("");
	const [date, setDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
	const [emoji, setEmoji] = useState("");
	const [geoCodingError, setGeocodingError] = useState("");
	const {createCity, isLoading} = useCities();
	const navigate = useNavigate();

	useEffect(() => {
		if (!lat && !lng) return;
		async function fetchCityData() {
			try {
				setIsLoadingGeocoding(true);
				setGeocodingError("");
				const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`);
				const data = await res.json();
				if (!data.countryCode)
					throw new Error("This does not seem to be a city, Click somewhere else!");
				setCityName(data.city || data.locality || "");
				setCountry(data.countryName);
				setEmoji(convertToEmoji(data.countryCode));
			} catch (e) {
				setGeocodingError(e.message);
			} finally {
				setIsLoadingGeocoding(false);
			}
		}
		fetchCityData();
	}, [lat, lng]);

	async function handleSubmit(e) {
		e.preventDefault();
		if (!cityName || !date) return;
		const newCity = {
			cityName,
			country,
			emoji,
			date,
			notes,
			position: {lat, lng},
			id: uniqid.process(),
		};
		await createCity(newCity);
		navigate("/app");
	}

	if (isLoadingGeocoding) return <Spinner />;
	if (!lat && !lng) return <Message message="Start by clicking somewhere on the map" />;
	if (geoCodingError) return <Message message={geoCodingError} />;

	return (
		<form className={`${styles.form} ${isLoading ? styles.loading : ""}`} onSubmit={handleSubmit}>
			<div className={styles.row}>
				<label htmlFor="cityName">City name</label>
				<input id="cityName" onChange={e => setCityName(e.target.value)} value={cityName} />
				<span className={styles.flag}>{emoji}</span>
			</div>

			<div className={styles.row}>
				<label htmlFor="date">When did you go to {cityName}?</label>
				<DatePicker
					onChange={date => setDate(date)}
					selected={date}
					dateFormat="dd/MM/yyyy"
					id="date"
				/>
			</div>

			<div className={styles.row}>
				<label htmlFor="notes">Notes about your trip to {cityName}</label>
				<textarea id="notes" onChange={e => setNotes(e.target.value)} value={notes} />
			</div>

			<div className={styles.buttons}>
				<Button type="primary">Add</Button>
				<BackButton />
			</div>
		</form>
	);
}

export default Form;

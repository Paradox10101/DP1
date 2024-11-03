import { Button, Input } from "@nextui-org/react";
import { filteredShipmentsAtom, searchInputAtom, searchQueryAtom } from '../../atoms/shipmentAtoms';
import { Filter, Map } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio"
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useAtom, useAtomValue } from "jotai";
import { useShipmentWebSocket } from '../../hooks/useShipmentWebSocket';


export default function OpcionEnvios(){
    useShipmentWebSocket();
    const shipments = useAtomValue(filteredShipmentsAtom);
    const [searchInput, setSearchInput] = useAtom(searchInputAtom);
    const [, setSearchQuery] = useAtom(searchQueryAtom);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);

        return () => clearTimeout(debounceTimeout);
        }, [searchInput, setSearchQuery]);

        const handleSearchChange = useCallback((e) => {
        setSearchInput(e.target.value);
        }, [setSearchInput]);


    const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <Map size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay envíos registrados</p>
    </div>
    );

    const NoResultsMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <SearchX size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No se encontraron resultados</p>
        <p className="text-sm">Intenta con otros términos de búsqueda</p>
    </div>
    );

    const shipmentsCount = shipments?.length || 0;
    const hasInitialData = Array.isArray(shipments);
    const hasSearchResults = hasInitialData && shipments.length > 0;
    const isSearching = searchInput.length > 0;

    return (
        <>
        {!hasInitialData?(
                <NoDataMessage />
            ) : (
            <div className="h-full">
                <div className="flex justify-between flex-row items-center">
                    <Input
                    type="text"
                    placeholder="ID de envio, ciudad origen / destino"
                    className="focus:outline-none border-2 stroke-black rounded-2xl h-8 pequenno w-[77%]"
                    startContent={<Map className="mr-2"/>}
                    />
                    <Button
                    disableRipple={true}
                    startContent={<Filter className="size-2"/>}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                    >
                    Filtros
                    </Button>
                </div>
                <div className="text-right pequenno text-[#939393]">
                    Cantidad de envíos: {shipments&&shipments?shipments.length:0}
                </div>
                <div className="flex flex-col gap-3 overflow-y-scroll max-h-[70vh] scroll-area">
                {shipments&&
                    shipments.map((shipment)=>{
                        return(
                            <CardEnvio shipment={shipment} key={shipment.id}/>
                        )
                        }
                )}
                </div>
            </div>
            )
        }

        </>
    )

}